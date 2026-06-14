from django.db import models
from django.core.validators import MinValueValidator


class Baby(models.Model):
    GENDER_CHOICES = [
        ('M', '男宝'),
        ('F', '女宝'),
        ('U', '未知'),
    ]

    name = models.CharField('宝宝昵称', max_length=50)
    gender = models.CharField('性别', max_length=1, choices=GENDER_CHOICES, default='U')
    birth_date = models.DateField('出生日期')
    note = models.TextField('备注', blank=True, null=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        db_table = 'baby'
        ordering = ['-created_at']
        verbose_name = '宝宝档案'
        verbose_name_plural = verbose_name

    def __str__(self):
        return self.name


class GrowthRecord(models.Model):
    baby = models.ForeignKey(Baby, on_delete=models.CASCADE, related_name='growth_records', verbose_name='宝宝')
    record_date = models.DateField('记录日期')
    height = models.FloatField('身高(cm)', validators=[MinValueValidator(0)])
    weight = models.FloatField('体重(kg)', validators=[MinValueValidator(0)])
    head_circumference = models.FloatField('头围(cm)', validators=[MinValueValidator(0)], blank=True, null=True)
    note = models.TextField('备注', blank=True, null=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        db_table = 'growth_record'
        ordering = ['-record_date']
        verbose_name = '成长记录'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.baby.name} {self.record_date}'


class ClothingItem(models.Model):
    CATEGORY_CHOICES = [
        ('onesie', '连体衣'),
        ('tshirt', 'T恤'),
        ('shirt', '衬衫'),
        ('pants', '裤子'),
        ('shorts', '短裤'),
        ('dress', '连衣裙'),
        ('skirt', '裙子'),
        ('coat', '外套'),
        ('jacket', '夹克'),
        ('sweater', '毛衣'),
        ('hoodie', '卫衣'),
        ('underwear', '内衣'),
        ('socks', '袜子'),
        ('shoes', '鞋子'),
        ('hat', '帽子'),
        ('bib', '围兜'),
        ('blanket', '毯子'),
        ('sleepwear', '睡衣'),
        ('swimwear', '泳装'),
        ('other', '其他'),
    ]

    SIZE_TYPE_CHOICES = [
        ('height', '按身高码'),
        ('age', '按月龄码'),
        ('eu', '欧码'),
        ('us', '美码'),
        ('cn', '国标码'),
    ]

    SEASON_CHOICES = [
        ('spring', '春季'),
        ('summer', '夏季'),
        ('autumn', '秋季'),
        ('winter', '冬季'),
        ('all', '四季通用'),
    ]

    CONDITION_CHOICES = [
        ('new', '全新'),
        ('like_new', '9成新'),
        ('good', '8成新'),
        ('fair', '7成新'),
        ('worn', '有使用痕迹'),
    ]

    STATUS_CHOICES = [
        ('keep', '自留'),
        ('to_give', '待转送'),
        ('reserved', '已预定'),
        ('given', '已送出'),
    ]

    baby = models.ForeignKey(Baby, on_delete=models.CASCADE, related_name='clothes', verbose_name='所属宝宝')
    name = models.CharField('物品名称', max_length=200)
    category = models.CharField('品类', max_length=30, choices=CATEGORY_CHOICES)
    size_type = models.CharField('尺码类型', max_length=10, choices=SIZE_TYPE_CHOICES, default='height')
    size_value = models.CharField('尺码值', max_length=20)
    size_label = models.CharField('尺码标签展示', max_length=50, blank=True)
    min_height = models.FloatField('适合最小身高(cm)', validators=[MinValueValidator(0)])
    max_height = models.FloatField('适合最大身高(cm)', validators=[MinValueValidator(0)])
    min_age_months = models.IntegerField('适合最小月龄', validators=[MinValueValidator(0)])
    max_age_months = models.IntegerField('适合最大月龄', validators=[MinValueValidator(0)])
    season = models.CharField('适用季节', max_length=10, choices=SEASON_CHOICES)
    condition = models.CharField('成色', max_length=10, choices=CONDITION_CHOICES, default='good')
    brand = models.CharField('品牌', max_length=100, blank=True)
    purchase_date = models.DateField('购入时间', blank=True, null=True)
    purchase_price = models.DecimalField('购入价格', max_digits=10, decimal_places=2, blank=True, null=True)
    status = models.CharField('当前状态', max_length=10, choices=STATUS_CHOICES, default='keep')
    note = models.TextField('备注', blank=True, null=True)
    image_url = models.URLField('图片链接', blank=True, null=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        db_table = 'clothing_item'
        ordering = ['-created_at']
        verbose_name = '衣物档案'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.name} ({self.size_label or self.size_value})'


class TransferRecipient(models.Model):
    name = models.CharField('接收人姓名', max_length=100)
    relation = models.CharField('与您关系', max_length=50, blank=True)
    baby_name = models.CharField('对方宝宝姓名', max_length=50, blank=True)
    phone = models.CharField('联系方式', max_length=30, blank=True)
    address = models.TextField('地址', blank=True)
    note = models.TextField('备注', blank=True, null=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        db_table = 'transfer_recipient'
        ordering = ['-created_at']
        verbose_name = '转送对象'
        verbose_name_plural = verbose_name

    def __str__(self):
        return self.name


class TransferRecord(models.Model):
    item = models.ForeignKey(ClothingItem, on_delete=models.CASCADE, related_name='transfers', verbose_name='物品')
    recipient = models.ForeignKey(TransferRecipient, on_delete=models.SET_NULL, null=True, blank=True, related_name='transfers', verbose_name='转送对象')
    recipient_name = models.CharField('接收人(冗余)', max_length=100, blank=True)
    transfer_date = models.DateField('交接时间')
    note = models.TextField('备注', blank=True, null=True)
    status = models.CharField('转送状态', max_length=10, choices=[
        ('pending', '待交接'),
        ('completed', '已完成'),
        ('cancelled', '已取消'),
    ], default='completed')
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        db_table = 'transfer_record'
        ordering = ['-transfer_date']
        verbose_name = '转送记录'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.item.name} -> {self.recipient_name}'

    def save(self, *args, **kwargs):
        if self.recipient and not self.recipient_name:
            self.recipient_name = self.recipient.name
        super().save(*args, **kwargs)
