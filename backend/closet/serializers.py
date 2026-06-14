from rest_framework import serializers
from .models import Baby, GrowthRecord, ClothingItem, TransferRecipient, TransferRecord

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
