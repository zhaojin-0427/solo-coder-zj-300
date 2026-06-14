from django.contrib import admin
from .models import Baby, GrowthRecord, ClothingItem, TransferRecipient, TransferRecord


@admin.register(Baby)
class BabyAdmin(admin.ModelAdmin):
    list_display = ['name', 'gender', 'birth_date', 'created_at']
    search_fields = ['name']


@admin.register(GrowthRecord)
class GrowthRecordAdmin(admin.ModelAdmin):
    list_display = ['baby', 'record_date', 'height', 'weight']
    list_filter = ['baby']


@admin.register(ClothingItem)
class ClothingItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'size_label', 'status', 'baby']
    list_filter = ['category', 'season', 'condition', 'status', 'baby']
    search_fields = ['name', 'brand']


@admin.register(TransferRecipient)
class TransferRecipientAdmin(admin.ModelAdmin):
    list_display = ['name', 'relation', 'baby_name', 'phone']


@admin.register(TransferRecord)
class TransferRecordAdmin(admin.ModelAdmin):
    list_display = ['item', 'recipient_name', 'transfer_date', 'status']
    list_filter = ['status', 'transfer_date']
