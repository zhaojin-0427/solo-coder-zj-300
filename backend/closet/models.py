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
        ('lent', '借出中'),
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


class SeasonPlan(models.Model):
    STATUS_CHOICES = [
        ('draft', '草稿'),
        ('in_progress', '进行中'),
        ('completed', '已完成'),
    ]

    SEASON_CHOICES = [
        ('spring', '春季'),
        ('summer', '夏季'),
        ('autumn', '秋季'),
        ('winter', '冬季'),
    ]

    baby = models.ForeignKey(Baby, on_delete=models.CASCADE, related_name='season_plans', verbose_name='宝宝')
    name = models.CharField('计划名称', max_length=200)
    target_season = models.CharField('目标季节', max_length=10, choices=SEASON_CHOICES)
    plan_date = models.DateField('计划日期')
    completed_date = models.DateField('完成时间', blank=True, null=True)
    status = models.CharField('计划状态', max_length=15, choices=STATUS_CHOICES, default='draft')
    note = models.TextField('整理备注', blank=True, null=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        db_table = 'season_plan'
        ordering = ['-created_at']
        verbose_name = '换季整理计划'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.name} - {self.get_target_season_display()}'


class SeasonPlanItem(models.Model):
    CATEGORY_CHOICES = [
        ('continue_wear', '本季可继续穿'),
        ('near_unsuitable', '即将不合身'),
        ('suggest_transfer', '建议转送'),
        ('next_season_prep', '下一季待准备'),
        ('lent', '暂不可整理(借出中)'),
    ]

    plan = models.ForeignKey(SeasonPlan, on_delete=models.CASCADE, related_name='plan_items', verbose_name='所属计划')
    item = models.ForeignKey(ClothingItem, on_delete=models.CASCADE, related_name='season_plan_items', verbose_name='衣物', blank=True, null=True)
    auto_category = models.CharField('系统自动分类', max_length=20, choices=CATEGORY_CHOICES)
    user_category = models.CharField('用户调整分类', max_length=20, choices=CATEGORY_CHOICES, blank=True, null=True)
    item_status_action = models.CharField('批量操作状态', max_length=15, choices=[
        ('to_give', '标记待转送'),
        ('reserved', '标记已预定'),
        ('keep', '继续自留'),
        ('none', '无操作'),
    ], default='none')
    item_name = models.CharField('物品名称(冗余)', max_length=200, blank=True)
    item_category = models.CharField('品类(冗余)', max_length=30, blank=True)
    item_size_label = models.CharField('尺码(冗余)', max_length=50, blank=True)
    item_season = models.CharField('季节(冗余)', max_length=10, blank=True)
    item_condition = models.CharField('成色(冗余)', max_length=10, blank=True)
    note = models.TextField('备注', blank=True, null=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        db_table = 'season_plan_item'
        ordering = ['auto_category', '-created_at']
        verbose_name = '换季计划条目'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.item_name or self.item} - {self.get_effective_category_display()}'

    def get_effective_category(self):
        return self.user_category or self.auto_category

    def get_effective_category_display(self):
        effective = self.get_effective_category()
        cat_map = dict(self.CATEGORY_CHOICES)
        return cat_map.get(effective, effective)

    def save(self, *args, **kwargs):
        if self.item:
            if not self.item_name:
                self.item_name = self.item.name
            if not self.item_category:
                self.item_category = self.item.category
            if not self.item_size_label:
                self.item_size_label = self.item.size_label or self.item.size_value
            if not self.item_season:
                self.item_season = self.item.season
            if not self.item_condition:
                self.item_condition = self.item.condition
        super().save(*args, **kwargs)


class BorrowObject(models.Model):
    RELATION_CHOICES = [
        ('family', '家人'),
        ('relative', '亲戚'),
        ('friend', '朋友'),
        ('neighbor', '邻居'),
        ('colleague', '同事'),
        ('other', '其他'),
    ]

    name = models.CharField('借穿人姓名', max_length=100)
    relation = models.CharField('与您关系', max_length=20, choices=RELATION_CHOICES, blank=True)
    baby_name = models.CharField('对方宝宝姓名', max_length=50, blank=True)
    baby_gender = models.CharField('宝宝性别', max_length=1, choices=Baby.GENDER_CHOICES, default='U')
    baby_birth_date = models.DateField('宝宝出生日期', blank=True, null=True)
    phone = models.CharField('联系方式', max_length=30, blank=True)
    address = models.TextField('地址', blank=True)
    note = models.TextField('备注', blank=True, null=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        db_table = 'borrow_object'
        ordering = ['-created_at']
        verbose_name = '借穿对象'
        verbose_name_plural = verbose_name

    def __str__(self):
        if self.baby_name:
            return f'{self.name}({self.baby_name})'
        return self.name


class BorrowRecord(models.Model):
    STATUS_CHOICES = [
        ('borrowed', '借出中'),
        ('overdue', '逾期未还'),
        ('returned', '已归还'),
        ('returned_damaged', '归还有损坏'),
    ]

    WASH_STATUS_CHOICES = [
        ('unwashed', '未清洗'),
        ('washed', '已清洗'),
        ('to_wash', '需清洗后归还'),
    ]

    CONDITION_CHANGE_CHOICES = [
        ('same', '无变化'),
        ('slight', '轻微变旧'),
        ('noticeable', '明显变旧'),
        ('damaged', '有损坏'),
    ]

    item = models.ForeignKey(ClothingItem, on_delete=models.CASCADE, related_name='borrow_records', verbose_name='借出物品')
    borrower = models.ForeignKey(BorrowObject, on_delete=models.SET_NULL, null=True, blank=True, related_name='borrow_records', verbose_name='借穿对象')
    borrower_name = models.CharField('借穿人(冗余)', max_length=100, blank=True)
    baby_name = models.CharField('借穿宝宝(冗余)', max_length=50, blank=True)
    borrow_date = models.DateField('借出时间')
    expected_return_date = models.DateField('预计归还时间', blank=True, null=True)
    actual_return_date = models.DateField('实际归还时间', blank=True, null=True)
    status = models.CharField('归还状态', max_length=20, choices=STATUS_CHOICES, default='borrowed')
    original_condition = models.CharField('借出时成色', max_length=10, choices=ClothingItem.CONDITION_CHOICES)
    return_condition = models.CharField('归还时成色', max_length=10, choices=ClothingItem.CONDITION_CHOICES, blank=True, null=True)
    condition_change = models.CharField('成色变化', max_length=20, choices=CONDITION_CHANGE_CHOICES, blank=True, null=True)
    wash_status = models.CharField('清洗状态', max_length=20, choices=WASH_STATUS_CHOICES, default='unwashed')
    note = models.TextField('备注', blank=True, null=True)
    return_note = models.TextField('归还备注', blank=True, null=True)
    suggest_transfer = models.BooleanField('建议转送', default=False)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        db_table = 'borrow_record'
        ordering = ['-borrow_date', '-created_at']
        verbose_name = '借穿记录'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.item.name} -> {self.borrower_name}'

    def save(self, *args, **kwargs):
        if self.borrower and not self.borrower_name:
            self.borrower_name = self.borrower.name
        if self.borrower and self.borrower.baby_name and not self.baby_name:
            self.baby_name = self.borrower.baby_name
        super().save(*args, **kwargs)

    def is_overdue(self):
        from datetime import date
        if self.status in ['borrowed', 'overdue'] and self.expected_return_date:
            return date.today() > self.expected_return_date
        return False

    def update_overdue_status(self):
        if self.is_overdue() and self.status == 'borrowed':
            self.status = 'overdue'
            self.save(update_fields=['status', 'updated_at'])
