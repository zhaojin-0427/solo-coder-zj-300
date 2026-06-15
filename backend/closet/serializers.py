from rest_framework import serializers
from .models import Baby, GrowthRecord, ClothingItem, TransferRecipient, TransferRecord, SeasonPlan, SeasonPlanItem, BorrowObject, BorrowRecord
from datetime import date

HEIGHT_BASED_CATEGORIES = {
    'onesie', 'tshirt', 'shirt', 'pants', 'shorts', 'dress', 'skirt',
    'coat', 'jacket', 'sweater', 'hoodie', 'sleepwear', 'swimwear',
    'underwear',
}

AGE_BASED_CATEGORIES = {
    'socks', 'shoes', 'hat', 'bib', 'blanket', 'other',
}


def get_baby_age_months(birth_date):
    from datetime import date
    today = date.today()
    age_months = (today.year - birth_date.year) * 12 + (today.month - birth_date.month)
    if today.day < birth_date.day:
        age_months -= 1
    return max(0, age_months)


def calculate_fit(item, baby, current_height=None):
    if not baby:
        return 'unknown', ''

    age_months = get_baby_age_months(baby.birth_date)
    cat = item.category

    if cat in AGE_BASED_CATEGORIES:
        if age_months > item.max_age_months:
            return 'too_small', f'月龄{age_months}月已超过上限{item.max_age_months}月'
        if age_months >= item.max_age_months * 0.9:
            return 'near_limit', f'月龄{age_months}月接近上限{item.max_age_months}月'
        if age_months < item.min_age_months:
            return 'too_big', f'月龄{age_months}月低于下限{item.min_age_months}月'
        return 'fits', f'月龄{age_months}月，适合{item.min_age_months}-{item.max_age_months}月'

    if current_height:
        if current_height > item.max_height:
            return 'too_small', f'身高{current_height}cm已超过上限{item.max_height}cm'
        if current_height >= item.max_height * 0.9:
            return 'near_limit', f'身高{current_height}cm接近上限{item.max_height}cm'
        if current_height < item.min_height:
            return 'too_big', f'身高{current_height}cm低于下限{item.min_height}cm'

    if age_months > item.max_age_months:
        return 'too_small', f'月龄{age_months}月已超过上限{item.max_age_months}月'
    if age_months >= item.max_age_months * 0.9:
        return 'near_limit', f'月龄{age_months}月接近上限{item.max_age_months}月'
    if age_months < item.min_age_months:
        return 'too_big', f'月龄{age_months}月低于下限{item.min_age_months}月'

    return 'fits', f'身高{current_height or "-"}cm，月龄{age_months}月'


class BabySerializer(serializers.ModelSerializer):
    current_age_months = serializers.SerializerMethodField()

    class Meta:
        model = Baby
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

    def get_current_age_months(self, obj):
        from datetime import date
        today = date.today()
        age_months = (today.year - obj.birth_date.year) * 12 + (today.month - obj.birth_date.month)
        if today.day < obj.birth_date.day:
            age_months -= 1
        return max(0, age_months)


class GrowthRecordSerializer(serializers.ModelSerializer):
    baby_name = serializers.CharField(source='baby.name', read_only=True)

    class Meta:
        model = GrowthRecord
        fields = '__all__'
        read_only_fields = ('created_at',)


class ClothingItemSerializer(serializers.ModelSerializer):
    baby_name = serializers.CharField(source='baby.name', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    season_display = serializers.CharField(source='get_season_display', read_only=True)
    condition_display = serializers.CharField(source='get_condition_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    size_type_display = serializers.CharField(source='get_size_type_display', read_only=True)
    fit_status = serializers.SerializerMethodField()
    current_borrow = serializers.SerializerMethodField()
    is_borrowed = serializers.SerializerMethodField()

    class Meta:
        model = ClothingItem
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

    def get_fit_status(self, obj):
        baby = obj.baby
        if not baby:
            return 'unknown'
        latest_growth = baby.growth_records.order_by('-record_date').first()
        current_height = latest_growth.height if latest_growth else None
        fit_status, _ = calculate_fit(obj, baby, current_height)
        return fit_status

    def get_is_borrowed(self, obj):
        return obj.status == 'lent'

    def get_current_borrow(self, obj):
        if obj.status != 'lent':
            return None
        current_borrow = obj.borrow_records.filter(status__in=['borrowed', 'overdue']).order_by('-created_at').first()
        if current_borrow:
            return BorrowRecordSummarySerializer(current_borrow).data
        return None


class TransferRecipientSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransferRecipient
        fields = '__all__'
        read_only_fields = ('created_at',)


class TransferRecordSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    item_size = serializers.CharField(source='item.size_label', read_only=True)
    recipient_info = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = TransferRecord
        fields = '__all__'
        read_only_fields = ('created_at',)

    def get_recipient_info(self, obj):
        if obj.recipient:
            return TransferRecipientSerializer(obj.recipient).data
        return {'name': obj.recipient_name} if obj.recipient_name else None

    def _sync_item_status(self, instance, old_status=None):
        item = instance.item
        new_status = instance.status
        if not item:
            return

        if old_status is None:
            if new_status == 'pending':
                item.status = 'reserved'
                item.save(update_fields=['status'])
            elif new_status == 'completed':
                item.status = 'given'
                item.save(update_fields=['status'])
            return

        if old_status != new_status:
            if new_status == 'completed':
                item.status = 'given'
                item.save(update_fields=['status'])
            elif new_status == 'pending':
                if item.status != 'given':
                    item.status = 'reserved'
                    item.save(update_fields=['status'])
            elif new_status == 'cancelled':
                if item.status in ('reserved', 'given'):
                    item.status = 'to_give'
                    item.save(update_fields=['status'])

    def create(self, validated_data):
        instance = super().create(validated_data)
        self._sync_item_status(instance)
        return instance

    def update(self, instance, validated_data):
        old_status = instance.status
        instance = super().update(instance, validated_data)
        self._sync_item_status(instance, old_status=old_status)
        return instance


SEASON_NEXT_MAP = {
    'spring': 'summer',
    'summer': 'autumn',
    'autumn': 'winter',
    'winter': 'spring',
}


def auto_classify_item(item, baby, target_season, current_height=None, age_months=None):
    if age_months is None:
        age_months = get_baby_age_months(baby.birth_date)

    cat = item.category
    item_season = item.season

    season_matches_current = (
        item_season == 'all' or
        item_season == target_season or
        (item_season in ('spring', 'autumn') and target_season in ('spring', 'autumn'))
    )

    if cat in AGE_BASED_CATEGORIES:
        fit = 'fits'
        if age_months > item.max_age_months:
            fit = 'too_small'
        elif age_months >= item.max_age_months * 0.9:
            fit = 'near_limit'
        elif age_months < item.min_age_months:
            fit = 'too_big'
    else:
        if current_height:
            if current_height > item.max_height:
                fit = 'too_small'
            elif current_height >= item.max_height * 0.9:
                fit = 'near_limit'
            elif current_height < item.min_height:
                fit = 'too_big'
            else:
                fit = 'fits'
        else:
            if age_months > item.max_age_months:
                fit = 'too_small'
            elif age_months >= item.max_age_months * 0.9:
                fit = 'near_limit'
            elif age_months < item.min_age_months:
                fit = 'too_big'
            else:
                fit = 'fits'

    if fit == 'too_small':
        return 'suggest_transfer'

    if fit == 'near_limit':
        return 'near_unsuitable'

    if fit == 'too_big':
        return 'next_season_prep'

    if fit == 'fits':
        if season_matches_current:
            return 'continue_wear'
        else:
            return 'next_season_prep'

    return 'continue_wear'


def generate_auto_classified_items(baby, target_season):
    age_months = get_baby_age_months(baby.birth_date)
    latest_growth = baby.growth_records.order_by('-record_date').first()
    current_height = latest_growth.height if latest_growth else None

    items = ClothingItem.objects.filter(
        baby=baby,
        status__in=['keep', 'to_give', 'reserved']
    )

    lent_items = ClothingItem.objects.filter(
        baby=baby,
        status='lent'
    )

    classified = []
    for item in items:
        category = auto_classify_item(item, baby, target_season, current_height, age_months)
        classified.append({
            'item': item,
            'auto_category': category,
        })

    for item in lent_items:
        classified.append({
            'item': item,
            'auto_category': 'lent',
        })
    return classified


class SeasonPlanItemSerializer(serializers.ModelSerializer):
    effective_category = serializers.SerializerMethodField()
    effective_category_display = serializers.SerializerMethodField()
    auto_category_display = serializers.CharField(source='get_auto_category_display', read_only=True)
    item_status_action_display = serializers.SerializerMethodField()
    item_info = serializers.SerializerMethodField()
    item_current_borrow = serializers.SerializerMethodField()

    class Meta:
        model = SeasonPlanItem
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

    def get_effective_category(self, obj):
        return obj.get_effective_category()

    def get_effective_category_display(self, obj):
        return obj.get_effective_category_display()

    def get_item_status_action_display(self, obj):
        action_map = {
            'to_give': '待转送',
            'reserved': '已预定',
            'keep': '继续自留',
            'none': '无操作',
        }
        return action_map.get(obj.item_status_action, obj.item_status_action)

    def get_item_info(self, obj):
        if obj.item:
            return ClothingItemSerializer(obj.item).data
        return None

    def get_item_current_borrow(self, obj):
        if obj.item and hasattr(obj.item, 'is_borrowed') and obj.item.is_borrowed:
            current_borrow = BorrowRecord.objects.filter(
                item=obj.item,
                status__in=['borrowed', 'overdue']
            ).first()
            if current_borrow:
                return BorrowRecordSummarySerializer(current_borrow).data
        return None


class SeasonPlanSerializer(serializers.ModelSerializer):
    baby_name = serializers.CharField(source='baby.name', read_only=True)
    target_season_display = serializers.CharField(source='get_target_season_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    plan_items = SeasonPlanItemSerializer(many=True, read_only=True)
    stats = serializers.SerializerMethodField()

    class Meta:
        model = SeasonPlan
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'completed_date')

    def get_stats(self, obj):
        items = obj.plan_items.all()
        result = {
            'continue_wear': 0,
            'near_unsuitable': 0,
            'suggest_transfer': 0,
            'next_season_prep': 0,
            'lent': 0,
            'action_to_give': 0,
            'action_reserved': 0,
            'action_keep': 0,
            'action_none': 0,
        }
        for item in items:
            cat = item.get_effective_category()
            if cat in result:
                result[cat] += 1
            action_key = f'action_{item.item_status_action}'
            if action_key in result:
                result[action_key] += 1
        return result

    def create(self, validated_data):
        plan = super().create(validated_data)
        baby = plan.baby
        classified_items = generate_auto_classified_items(baby, plan.target_season)
        for ci in classified_items:
            SeasonPlanItem.objects.create(
                plan=plan,
                item=ci['item'],
                auto_category=ci['auto_category'],
            )
        return plan

    def update(self, instance, validated_data):
        old_status = instance.status
        new_status = validated_data.get('status', old_status)
        if old_status != 'completed' and new_status == 'completed':
            from datetime import date
            validated_data['completed_date'] = date.today()
        elif old_status == 'completed' and new_status != 'completed':
            validated_data['completed_date'] = None
        return super().update(instance, validated_data)


class SeasonPlanRegenerateSerializer(serializers.Serializer):
    pass


class SeasonPlanBatchActionSerializer(serializers.Serializer):
    item_ids = serializers.ListField(child=serializers.IntegerField())
    action = serializers.ChoiceField(choices=[
        ('to_give', '标记待转送'),
        ('reserved', '标记已预定'),
        ('keep', '继续自留'),
        ('none', '清除操作'),
    ])


class SeasonPlanChangeCategorySerializer(serializers.Serializer):
    item_ids = serializers.ListField(child=serializers.IntegerField())
    category = serializers.ChoiceField(choices=SeasonPlanItem.CATEGORY_CHOICES)


class BorrowObjectSerializer(serializers.ModelSerializer):
    relation_display = serializers.CharField(source='get_relation_display', read_only=True)
    baby_gender_display = serializers.CharField(source='get_baby_gender_display', read_only=True)
    borrow_count = serializers.SerializerMethodField()
    current_borrow_count = serializers.SerializerMethodField()

    class Meta:
        model = BorrowObject
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

    def get_borrow_count(self, obj):
        return obj.borrow_records.count()

    def get_current_borrow_count(self, obj):
        return obj.borrow_records.filter(status__in=['borrowed', 'overdue']).count()


class BorrowRecordSummarySerializer(serializers.ModelSerializer):
    borrower_info = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    original_condition_display = serializers.CharField(source='get_original_condition_display', read_only=True)
    return_condition_display = serializers.CharField(source='get_return_condition_display', read_only=True)
    condition_change_display = serializers.CharField(source='get_condition_change_display', read_only=True)
    wash_status_display = serializers.CharField(source='get_wash_status_display', read_only=True)
    item_name = serializers.CharField(source='item.name', read_only=True)
    item_category = serializers.CharField(source='item.category', read_only=True)
    item_size_label = serializers.CharField(source='item.size_label', read_only=True)
    is_overdue = serializers.SerializerMethodField()
    days_borrowed = serializers.SerializerMethodField()
    days_overdue = serializers.SerializerMethodField()

    class Meta:
        model = BorrowRecord
        fields = [
            'id', 'item', 'item_name', 'item_category', 'item_size_label',
            'borrower', 'borrower_name', 'baby_name', 'borrower_info',
            'borrow_date', 'expected_return_date', 'actual_return_date',
            'status', 'status_display', 'original_condition', 'original_condition_display',
            'return_condition', 'return_condition_display', 'condition_change', 'condition_change_display',
            'wash_status', 'wash_status_display', 'note', 'return_note',
            'suggest_transfer', 'is_overdue', 'days_borrowed', 'days_overdue',
            'created_at', 'updated_at',
        ]
        read_only_fields = ('created_at', 'updated_at')

    def get_borrower_info(self, obj):
        if obj.borrower:
            return BorrowObjectSerializer(obj.borrower).data
        return {'name': obj.borrower_name, 'baby_name': obj.baby_name}

    def get_is_overdue(self, obj):
        return obj.is_overdue()

    def get_days_borrowed(self, obj):
        if not obj.borrow_date:
            return 0
        end_date = obj.actual_return_date or date.today()
        return (end_date - obj.borrow_date).days

    def get_days_overdue(self, obj):
        if not obj.is_overdue() or not obj.expected_return_date:
            return 0
        return (date.today() - obj.expected_return_date).days


class BorrowRecordSerializer(BorrowRecordSummarySerializer):
    def _sync_item_status(self, instance, old_status=None):
        item = instance.item
        new_status = instance.status
        if not item:
            return

        if old_status is None:
            if new_status in ['borrowed', 'overdue']:
                if item.status != 'lent':
                    item.status = 'lent'
                    item.save(update_fields=['status', 'updated_at'])
            return

        if old_status != new_status:
            if new_status in ['borrowed', 'overdue']:
                if item.status != 'lent':
                    item.status = 'lent'
                    item.save(update_fields=['status', 'updated_at'])
            elif new_status in ['returned', 'returned_damaged']:
                if item.status == 'lent':
                    if instance.suggest_transfer:
                        item.status = 'to_give'
                    else:
                        item.status = 'keep'
                    if instance.return_condition and instance.return_condition != instance.original_condition:
                        item.condition = instance.return_condition
                    item.save(update_fields=['status', 'condition', 'updated_at'])

    def create(self, validated_data):
        instance = super().create(validated_data)
        self._sync_item_status(instance)
        instance.update_overdue_status()
        return instance

    def update(self, instance, validated_data):
        old_status = instance.status
        instance = super().update(instance, validated_data)
        self._sync_item_status(instance, old_status=old_status)
        instance.update_overdue_status()
        return instance


class BorrowReturnSerializer(serializers.Serializer):
    actual_return_date = serializers.DateField(required=False)
    return_condition = serializers.ChoiceField(choices=ClothingItem.CONDITION_CHOICES)
    condition_change = serializers.ChoiceField(choices=BorrowRecord.CONDITION_CHANGE_CHOICES)
    wash_status = serializers.ChoiceField(choices=BorrowRecord.WASH_STATUS_CHOICES)
    return_note = serializers.CharField(required=False, allow_blank=True)
    suggest_transfer = serializers.BooleanField(default=False)
    status = serializers.ChoiceField(choices=[('returned', '已归还'), ('returned_damaged', '归还有损坏')], default='returned')


class BorrowStatisticsSerializer(serializers.Serializer):
    pass
