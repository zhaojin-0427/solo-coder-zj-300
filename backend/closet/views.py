from django.shortcuts import render
from django.db.models import Count, Avg, Q, Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from datetime import date, timedelta
from collections import defaultdict

from .models import Baby, GrowthRecord, ClothingItem, TransferRecipient, TransferRecord, SeasonPlan, SeasonPlanItem
from .serializers import (
    BabySerializer, GrowthRecordSerializer, ClothingItemSerializer,
    TransferRecipientSerializer, TransferRecordSerializer,
    SeasonPlanSerializer, SeasonPlanItemSerializer,
    SeasonPlanBatchActionSerializer, SeasonPlanChangeCategorySerializer,
    generate_auto_classified_items, calculate_fit, get_baby_age_months,
)


class BabyViewSet(viewsets.ModelViewSet):
    queryset = Baby.objects.all()
    serializer_class = BabySerializer


class GrowthRecordViewSet(viewsets.ModelViewSet):
    queryset = GrowthRecord.objects.all()
    serializer_class = GrowthRecordSerializer
    filterset_fields = ['baby']
    ordering_fields = ['record_date']


class ClothingItemViewSet(viewsets.ModelViewSet):
    queryset = ClothingItem.objects.all()
    serializer_class = ClothingItemSerializer
    filterset_fields = ['baby', 'category', 'season', 'condition', 'status']
    search_fields = ['name', 'brand']
    ordering_fields = ['created_at', 'purchase_date', 'max_height']

    @action(detail=False, methods=['get'], url_path='fit-analysis')
    def fit_analysis(self, request):
        baby_id = request.query_params.get('baby')
        items = self.get_queryset()
        if baby_id:
            items = items.filter(baby_id=baby_id)
        items = items.filter(status__in=['keep', 'to_give', 'reserved'])

        result = {
            'too_small': [],
            'near_limit': [],
            'fits': [],
            'too_big': [],
            'unknown': [],
        }

        for item in items:
            serializer = self.get_serializer(item)
            fit_status = serializer.data['fit_status']
            result[fit_status].append(serializer.data)

        counts = {k: len(v) for k, v in result.items()}
        return Response({'counts': counts, 'items': result})


class TransferRecipientViewSet(viewsets.ModelViewSet):
    queryset = TransferRecipient.objects.all()
    serializer_class = TransferRecipientSerializer


class TransferRecordViewSet(viewsets.ModelViewSet):
    queryset = TransferRecord.objects.all()
    serializer_class = TransferRecordSerializer
    filterset_fields = ['item', 'recipient', 'status']
    ordering_fields = ['transfer_date', 'created_at']


class StatisticsView(APIView):
    def get(self, request):
        baby_id = request.query_params.get('baby')

        clothes_qs = ClothingItem.objects.all()
        transfers_qs = TransferRecord.objects.all()
        growth_qs = GrowthRecord.objects.all()

        if baby_id:
            clothes_qs = clothes_qs.filter(baby_id=baby_id)
            transfers_qs = transfers_qs.filter(item__baby_id=baby_id)
            growth_qs = growth_qs.filter(baby_id=baby_id)

        total_items = clothes_qs.count()
        total_value = clothes_qs.aggregate(Sum('purchase_price'))['purchase_price__sum'] or 0

        status_stats = clothes_qs.values('status').annotate(count=Count('id')).order_by('-count')
        status_map = {}
        for s in status_stats:
            key = s['status']
            label_map = {
                'keep': '自留',
                'to_give': '待转送',
                'reserved': '已预定',
                'given': '已送出'
            }
            status_map[label_map.get(key, key)] = s['count']

        idle_count = status_map.get('待转送', 0) + status_map.get('已预定', 0)
        idle_rate = round(idle_count / total_items * 100, 1) if total_items > 0 else 0

        given_item_count = clothes_qs.filter(status='given').count()
        given_item_rate = round(given_item_count / total_items * 100, 1) if total_items > 0 else 0

        total_transfers = transfers_qs.count()
        completed_transfers = transfers_qs.filter(status='completed').count()
        transfer_success_rate = round(completed_transfers / total_transfers * 100, 1) if total_transfers > 0 else 0

        category_stats = clothes_qs.values('category').annotate(count=Count('id')).order_by('-count')
        category_labels = []
        category_values = []
        cat_map = {
            'onesie': '连体衣', 'tshirt': 'T恤', 'shirt': '衬衫', 'pants': '裤子',
            'shorts': '短裤', 'dress': '连衣裙', 'skirt': '裙子', 'coat': '外套',
            'jacket': '夹克', 'sweater': '毛衣', 'hoodie': '卫衣', 'underwear': '内衣',
            'socks': '袜子', 'shoes': '鞋子', 'hat': '帽子', 'bib': '围兜',
            'blanket': '毯子', 'sleepwear': '睡衣', 'swimwear': '泳装', 'other': '其他'
        }
        for c in category_stats:
            category_labels.append(cat_map.get(c['category'], c['category']))
            category_values.append(c['count'])

        season_stats = clothes_qs.values('season').annotate(count=Count('id')).order_by('-count')
        season_map = {}
        season_label_map = {'spring': '春季', 'summer': '夏季', 'autumn': '秋季', 'winter': '冬季', 'all': '四季'}
        for s in season_stats:
            season_map[season_label_map.get(s['season'], s['season'])] = s['count']

        size_cycle = self._calculate_size_cycle(clothes_qs.filter(status='given'), growth_qs)

        missing_categories = self._find_missing_categories(clothes_qs, growth_qs, baby_id)

        stock_suggestions = self._generate_stock_suggestions(clothes_qs, baby_id)

        monthly_transfers = transfers_qs.filter(status='completed').annotate(
            month=TruncMonth('transfer_date')
        ).values('month').annotate(count=Count('id')).order_by('month')
        monthly_x = []
        monthly_y = []
        for m in monthly_transfers:
            monthly_x.append(m['month'].strftime('%Y-%m'))
            monthly_y.append(m['count'])

        season_plan_stats = self._get_season_plan_stats(baby_id)

        return Response({
            'overview': {
                'total_items': total_items,
                'total_value': float(total_value),
                'idle_rate': idle_rate,
                'transfer_success_rate': transfer_success_rate,
                'total_transfers': total_transfers,
                'completed_transfers': completed_transfers,
                'given_item_count': given_item_count,
                'given_item_rate': given_item_rate,
            },
            'status_distribution': status_map,
            'category_stats': {'labels': category_labels, 'values': category_values},
            'season_distribution': season_map,
            'size_cycle': size_cycle,
            'missing_categories': missing_categories,
            'stock_suggestions': stock_suggestions,
            'monthly_transfers': {'labels': monthly_x, 'values': monthly_y},
            'season_plan_stats': season_plan_stats,
        })

    def _calculate_size_cycle(self, given_items_qs, growth_qs):
        size_groups = defaultdict(list)
        for item in given_items_qs:
            key = item.size_label or item.size_value
            if item.purchase_date:
                transfers = item.transfers.filter(status='completed').order_by('transfer_date')
                if transfers.exists():
                    use_days = (transfers.first().transfer_date - item.purchase_date).days
                    size_groups[key].append(use_days)

        result = []
        for size, days_list in sorted(size_groups.items()):
            avg_days = round(sum(days_list) / len(days_list))
            result.append({
                'size': size,
                'avg_cycle_days': avg_days,
                'count': len(days_list)
            })
        return result

    def _find_missing_categories(self, clothes_qs, growth_qs, baby_id):
        all_categories = [
            ('onesie', '连体衣'), ('tshirt', 'T恤'), ('pants', '裤子'),
            ('coat', '外套'), ('socks', '袜子'), ('hat', '帽子'),
            ('underwear', '内衣'), ('sleepwear', '睡衣'), ('shoes', '鞋子'),
        ]

        if not baby_id:
            return []

        try:
            baby = Baby.objects.get(id=baby_id)
        except Baby.DoesNotExist:
            return []

        age_months = get_baby_age_months(baby.birth_date)

        future_window = 6
        items = clothes_qs.filter(
            min_age_months__lte=age_months + future_window,
            max_age_months__gte=age_months,
            status__in=['keep', 'to_give', 'reserved']
        )

        cat_count = defaultdict(int)
        for item in items:
            cat_count[item.category] += 1

        missing = []
        daily_use_cats = {'onesie', 'tshirt', 'pants', 'socks', 'underwear'}
        for cat_code, cat_name in all_categories:
            count = cat_count.get(cat_code, 0)
            recommended = 3 if cat_code in daily_use_cats else 2
            if count < recommended:
                if count == 0:
                    urgency = 'high'
                elif count < recommended / 2:
                    urgency = 'high'
                else:
                    urgency = 'medium'
                missing.append({
                    'category': cat_name,
                    'code': cat_code,
                    'current_count': count,
                    'recommended_count': recommended,
                    'urgency': urgency,
                })

        return sorted(missing, key=lambda x: {'high': 0, 'medium': 1}[x['urgency']])

    def _generate_stock_suggestions(self, clothes_qs, baby_id):
        if not baby_id:
            return []

        try:
            baby = Baby.objects.get(id=baby_id)
        except Baby.DoesNotExist:
            return []

        today = date.today()
        current_month = today.month

        season_map = {
            (3, 4, 5): ('spring', '春季', '夏装'),
            (6, 7, 8): ('summer', '夏季', '秋装'),
            (9, 10, 11): ('autumn', '秋季', '冬装'),
            (12, 1, 2): ('winter', '冬季', '春装'),
        }

        current_season = None
        next_season_prep = None
        for months, (code, name, prep) in season_map.items():
            if current_month in months:
                current_season = (code, name)
                next_season_prep = prep
                break

        suggestions = []

        if next_season_prep:
            suggestions.append({
                'type': 'season_prep',
                'title': f'建议提前囤货：{next_season_prep}',
                'content': f'当前是{current_season[1]}，建议提前准备下一季节的衣物，避免换季时手忙脚乱。大一个尺码最合适。',
                'priority': 'medium',
            })

        age_months = (today.year - baby.birth_date.year) * 12 + (today.month - baby.birth_date.month)
        if today.day < baby.birth_date.day:
            age_months -= 1
        age_months = max(0, age_months)

        next_size_items = clothes_qs.filter(
            min_age_months__gt=age_months,
            min_age_months__lte=age_months + 6,
            status__in=['keep', 'to_give', 'reserved']
        ).count()

        if next_size_items < 5:
            suggestions.append({
                'type': 'next_size',
                'title': '下一尺码储备不足',
                'content': f'建议准备未来3-6个月穿的大码衣物，建议数量至少5-8件以上。',
                'priority': 'high',
            })

        growth_count = GrowthRecord.objects.filter(baby_id=baby_id).count()
        if growth_count == 0:
            suggestions.append({
                'type': 'growth_tracking',
                'title': '建议完善成长记录',
                'content': '完善身高体重记录后，系统可以更精准地判断衣物合身情况和提前预警。',
                'priority': 'high',
            })

        return suggestions

    def _get_season_plan_stats(self, baby_id):
        plans_qs = SeasonPlan.objects.all()
        if baby_id:
            plans_qs = plans_qs.filter(baby_id=baby_id)

        recent_plans = plans_qs.order_by('-created_at')[:3]
        plan_details = []
        avg_completion_rate = 0
        total_transfer_converted = 0
        all_next_gaps = defaultdict(int)

        for plan in recent_plans:
            items = plan.plan_items.all()
            total_items = items.count()

            suggest_transfer_count = items.filter(
                Q(user_category='suggest_transfer') |
                Q(user_category__isnull=True, auto_category='suggest_transfer')
            ).count()
            actual_to_give = items.filter(item_status_action='to_give').count()
            actual_reserved = items.filter(item_status_action='reserved').count()
            total_transfer_converted += actual_to_give + actual_reserved

            transfer_total = items.filter(
                item_status_action__in=['to_give', 'reserved']
            ).count()
            transfer_completed = 0
            if transfer_total > 0:
                for pi in items.filter(
                    item_status_action__in=['to_give', 'reserved']
                ).select_related('item'):
                    if pi.item and pi.item.status in ('reserved', 'given'):
                        transfer_completed += 1
            transfer_conversion_rate = round(
                transfer_completed / transfer_total * 100, 1
            ) if transfer_total > 0 else 0

            if plan.status == 'completed':
                completion_rate = 100
            elif total_items > 0:
                processed = items.exclude(item_status_action='none').count()
                completion_rate = round(processed / total_items * 100, 1)
            else:
                completion_rate = 0
            avg_completion_rate += completion_rate

            next_season_count = items.filter(
                Q(user_category='next_season_prep') |
                Q(user_category__isnull=True, auto_category='next_season_prep')
            ).count()
            daily_use_cats = {'onesie', 'tshirt', 'pants', 'socks', 'underwear'}
            next_cat_counts = defaultdict(int)
            for pi in items.filter(
                Q(user_category='next_season_prep') |
                Q(user_category__isnull=True, auto_category='next_season_prep')
            ).select_related('item'):
                if pi.item:
                    next_cat_counts[pi.item.category] += 1

            gaps = []
            cat_display = {
                'onesie': '连体衣', 'tshirt': 'T恤', 'pants': '裤子',
                'socks': '袜子', 'underwear': '内衣', 'sleepwear': '睡衣',
                'coat': '外套', 'shoes': '鞋子', 'hat': '帽子',
            }
            for cat_code, cat_name in cat_display.items():
                count = next_cat_counts.get(cat_code, 0)
                recommended = 3 if cat_code in daily_use_cats else 2
                gap = max(0, recommended - count)
                if gap > 0:
                    gaps.append({
                        'category': cat_name,
                        'code': cat_code,
                        'gap': gap,
                    })
                    all_next_gaps[cat_code] += gap
                gaps = sorted(gaps, key=lambda x: -x['gap'])

            plan_details.append({
                'plan_id': plan.id,
                'plan_name': plan.name,
                'target_season': plan.target_season,
                'target_season_display': plan.get_target_season_display(),
                'status': plan.status,
                'status_display': plan.get_status_display(),
                'plan_date': plan.plan_date,
                'completed_date': plan.completed_date,
                'total_items': total_items,
                'suggest_transfer_count': suggest_transfer_count,
                'actual_transfer_count': actual_to_give + actual_reserved,
                'transfer_conversion_rate': transfer_conversion_rate,
                'completion_rate': completion_rate,
                'next_season_prep_count': next_season_count,
                'next_season_gaps': gaps,
            })

        if len(recent_plans) > 0:
            avg_completion_rate = round(avg_completion_rate / len(recent_plans), 1)

        next_gap_summary = []
        for cat_code, gap in sorted(all_next_gaps.items(), key=lambda x: -x[1]):
            next_gap_summary.append({
                'category': {
                    'onesie': '连体衣', 'tshirt': 'T恤', 'pants': '裤子',
                    'socks': '袜子', 'underwear': '内衣', 'sleepwear': '睡衣',
                    'coat': '外套', 'shoes': '鞋子', 'hat': '帽子',
                }.get(cat_code, cat_code),
                'code': cat_code,
                'total_gap': gap,
            })

        return {
            'recent_plans': plan_details,
            'avg_completion_rate': avg_completion_rate,
            'total_transfer_converted': total_transfer_converted,
            'next_season_gap_summary': next_gap_summary,
        }


class GrowthFitView(APIView):
    def get(self, request):
        baby_id = request.query_params.get('baby')
        if not baby_id:
            return Response({'error': '请指定baby参数'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            baby = Baby.objects.get(id=baby_id)
        except Baby.DoesNotExist:
            return Response({'error': '宝宝不存在'}, status=status.HTTP_404_NOT_FOUND)

        latest_growth = baby.growth_records.order_by('-record_date').first()
        current_height = latest_growth.height if latest_growth else None
        current_weight = latest_growth.weight if latest_growth else None

        age_months = get_baby_age_months(baby.birth_date)

        items = ClothingItem.objects.filter(
            baby_id=baby_id,
            status__in=['keep', 'to_give', 'reserved']
        )

        too_small = []
        near_limit = []
        fits = []
        too_big = []

        for item in items:
            fit_status, fit_reason = calculate_fit(item, baby, current_height)

            data = ClothingItemSerializer(item).data
            data['fit_reason'] = fit_reason

            if fit_status == 'too_small':
                too_small.append(data)
            elif fit_status == 'near_limit':
                near_limit.append(data)
            elif fit_status == 'too_big':
                too_big.append(data)
            else:
                fits.append(data)

        warnings = []
        if near_limit:
            warnings.append({
                'level': 'warning',
                'text': f'有{len(near_limit)}件衣物即将不合身，建议考虑整理或转送'
            })
        if too_small:
            warnings.append({
                'level': 'danger',
                'text': f'有{len(too_small)}件衣物已经不合身，可以登记转送'
            })

        return Response({
            'baby': {
                'name': baby.name,
                'age_months': age_months,
                'height': current_height,
                'weight': current_weight,
            },
            'summary': {
                'total': items.count(),
                'too_small': len(too_small),
                'near_limit': len(near_limit),
                'fits': len(fits),
                'too_big': len(too_big),
            },
            'warnings': warnings,
            'items': {
                'too_small': too_small,
                'near_limit': near_limit,
                'fits': fits,
                'too_big': too_big,
            }
        })


class SeasonPlanViewSet(viewsets.ModelViewSet):
    queryset = SeasonPlan.objects.all()
    serializer_class = SeasonPlanSerializer
    filterset_fields = ['baby', 'target_season', 'status']
    ordering_fields = ['created_at', 'plan_date', 'completed_date']

    @action(detail=True, methods=['post'], url_path='regenerate')
    def regenerate_items(self, request, pk=None):
        plan = self.get_object()
        baby = plan.baby

        old_items = plan.plan_items.select_related('item').all()
        preserve_map = {}
        rollback_item_ids = []
        for old_pi in old_items:
            if old_pi.item_id:
                preserve_map[old_pi.item_id] = {
                    'user_category': old_pi.user_category,
                    'item_status_action': old_pi.item_status_action,
                    'note': old_pi.note,
                }
                if old_pi.item_status_action in ('to_give', 'reserved'):
                    rollback_item_ids.append(old_pi.item_id)

        if rollback_item_ids:
            ClothingItem.objects.filter(
                id__in=rollback_item_ids,
                status__in=['to_give', 'reserved']
            ).update(status='keep', updated_at=timezone.now())

        plan.plan_items.all().delete()

        classified_items = generate_auto_classified_items(baby, plan.target_season)
        created_items = []
        for ci in classified_items:
            item_id = ci['item'].id
            preserved = preserve_map.get(item_id, {})
            item_obj = SeasonPlanItem.objects.create(
                plan=plan,
                item=ci['item'],
                auto_category=ci['auto_category'],
                user_category=preserved.get('user_category'),
                item_status_action=preserved.get('item_status_action', 'none'),
                note=preserved.get('note'),
            )
            created_items.append(SeasonPlanItemSerializer(item_obj).data)

        result_msg = '已重新生成分类清单'
        if rollback_item_ids:
            result_msg += f'，已回滚 {len(rollback_item_ids)} 件衣物状态为自留'
        if preserve_map:
            preserved_user_count = sum(1 for v in preserve_map.values() if v.get('user_category') or v.get('item_status_action') != 'none')
            if preserved_user_count > 0:
                result_msg += f'，保留了 {preserved_user_count} 条用户调整记录'

        return Response({
            'message': result_msg,
            'count': len(created_items),
            'items': created_items,
        })

    @action(detail=True, methods=['post'], url_path='batch-action')
    def batch_action(self, request, pk=None):
        plan = self.get_object()
        serializer = SeasonPlanBatchActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item_ids = serializer.validated_data['item_ids']
        action_value = serializer.validated_data['action']

        items_qs = plan.plan_items.filter(id__in=item_ids).select_related('item')
        plan_items_list = list(items_qs)

        updated_count = plan.plan_items.filter(id__in=item_ids).update(item_status_action=action_value)

        transfer_records_created = 0
        rollback_count = 0

        if action_value in ('to_give', 'reserved', 'keep'):
            for plan_item in plan_items_list:
                if plan_item.item and plan_item.item.status != 'given':
                    plan_item.item.status = action_value
                    plan_item.item.save(update_fields=['status', 'updated_at'])

                    if action_value in ('to_give', 'reserved'):
                        existing = TransferRecord.objects.filter(
                            item=plan_item.item,
                            status__in=['pending']
                        ).first()
                        if not existing:
                            transfer_status = 'pending' if action_value == 'reserved' else 'pending'
                            TransferRecord.objects.create(
                                item=plan_item.item,
                                recipient=None,
                                recipient_name='',
                                transfer_date=date.today(),
                                note=f'来源：换季整理计划「{plan.name}」批量操作',
                                status=transfer_status,
                            )
                            transfer_records_created += 1

        elif action_value == 'none':
            for plan_item in plan_items_list:
                if plan_item.item and plan_item.item.status in ('to_give', 'reserved'):
                    plan_item.item.status = 'keep'
                    plan_item.item.save(update_fields=['status', 'updated_at'])
                    rollback_count += 1

                    TransferRecord.objects.filter(
                        item=plan_item.item,
                        status='pending'
                    ).update(status='cancelled')

        result_msg = f'已批量处理 {updated_count} 条记录'
        if transfer_records_created > 0:
            result_msg += f'，自动生成 {transfer_records_created} 条待交接转送记录'
        if rollback_count > 0:
            result_msg += f'，已恢复 {rollback_count} 件衣物为自留状态'

        return Response({
            'message': result_msg,
            'updated_count': updated_count,
            'transfer_records_created': transfer_records_created,
            'rollback_count': rollback_count,
        })

    @action(detail=True, methods=['post'], url_path='change-category')
    def change_category(self, request, pk=None):
        plan = self.get_object()
        serializer = SeasonPlanChangeCategorySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item_ids = serializer.validated_data['item_ids']
        category = serializer.validated_data['category']

        items_qs = plan.plan_items.filter(id__in=item_ids)
        updated_count = items_qs.update(user_category=category)

        return Response({
            'message': f'已更新 {updated_count} 条分类',
            'updated_count': updated_count,
        })

    @action(detail=True, methods=['post'], url_path='complete')
    def complete_plan(self, request, pk=None):
        plan = self.get_object()
        plan.status = 'completed'
        plan.completed_date = date.today()
        if 'note' in request.data:
            plan.note = request.data['note']
        plan.save()
        serializer = self.get_serializer(plan)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='recent-stats')
    def recent_stats(self, request):
        baby_id = request.query_params.get('baby')
        plans_qs = SeasonPlan.objects.all()
        if baby_id:
            plans_qs = plans_qs.filter(baby_id=baby_id)

        recent_plans = plans_qs.order_by('-created_at')[:3]
        recent_plan_stats = []
        for plan in recent_plans:
            items = plan.plan_items.all()
            total_items = items.count()
            suggest_transfer_count = items.filter(
                Q(user_category='suggest_transfer') |
                Q(user_category__isnull=True, auto_category='suggest_transfer')
            ).count()
            actual_transfer_count = items.filter(
                item_status_action__in=['to_give', 'reserved']
            ).count()

            transfer_completed = 0
            transfer_total = items.filter(item_status_action__in=['to_give', 'reserved']).count()
            if transfer_total > 0:
                for pi in items.filter(item_status_action__in=['to_give', 'reserved']).select_related('item'):
                    if pi.item and pi.item.status in ('reserved', 'given'):
                        transfer_completed += 1
            transfer_conversion_rate = round(
                transfer_completed / transfer_total * 100, 1
            ) if transfer_total > 0 else 0

            completion_rate = 100 if plan.status == 'completed' else round(
                (items.exclude(item_status_action='none').count() / total_items * 100), 1
            ) if total_items > 0 else 0

            next_season_prep_count = items.filter(
                Q(user_category='next_season_prep') |
                Q(user_category__isnull=True, auto_category='next_season_prep')
            ).count()
            daily_use_cats = {'onesie', 'tshirt', 'pants', 'socks', 'underwear'}
            next_season_gaps = []
            next_cat_counts = defaultdict(int)
            for pi in items.filter(
                Q(user_category='next_season_prep') |
                Q(user_category__isnull=True, auto_category='next_season_prep')
            ).select_related('item'):
                if pi.item:
                    next_cat_counts[pi.item.category] += 1
            for cat_code, cat_name in [
                ('onesie', '连体衣'), ('tshirt', 'T恤'), ('pants', '裤子'),
                ('socks', '袜子'), ('underwear', '内衣'), ('sleepwear', '睡衣'),
                ('coat', '外套'), ('shoes', '鞋子'), ('hat', '帽子'),
            ]:
                count = next_cat_counts.get(cat_code, 0)
                recommended = 3 if cat_code in daily_use_cats else 2
                if count < recommended:
                    next_season_gaps.append({
                        'category': cat_name,
                        'code': cat_code,
                        'current_count': count,
                        'recommended_count': recommended,
                        'gap': recommended - count,
                    })

            recent_plan_stats.append({
                'plan_id': plan.id,
                'plan_name': plan.name,
                'target_season': plan.target_season,
                'target_season_display': plan.get_target_season_display(),
                'status': plan.status,
                'status_display': plan.get_status_display(),
                'plan_date': plan.plan_date,
                'completed_date': plan.completed_date,
                'total_items': total_items,
                'suggest_transfer_count': suggest_transfer_count,
                'actual_transfer_count': actual_transfer_count,
                'transfer_conversion_rate': transfer_conversion_rate,
                'completion_rate': completion_rate,
                'next_season_prep_count': next_season_prep_count,
                'next_season_gaps': sorted(next_season_gaps, key=lambda x: -x['gap']),
            })

        return Response({'recent_plans': recent_plan_stats})
