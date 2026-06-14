from rest_framework import serializers
from .models import Baby, GrowthRecord, ClothingItem, TransferRecipient, TransferRecord


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

        from datetime import date
        today = date.today()
        age_months = (today.year - baby.birth_date.year) * 12 + (today.month - baby.birth_date.month)
        if today.day < baby.birth_date.day:
            age_months -= 1
        age_months = max(0, age_months)

        if current_height:
            if current_height > obj.max_height:
                return 'too_small'
            if current_height >= obj.max_height * 0.9:
                return 'near_limit'
            if current_height < obj.min_height:
                return 'too_big'

        if age_months > obj.max_age_months:
            return 'too_small'
        if age_months >= obj.max_age_months * 0.9:
            return 'near_limit'
        if age_months < obj.min_age_months:
            return 'too_big'

        return 'fits'


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
