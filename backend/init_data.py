import os


def init_db_data():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'babycloset.settings')
    import django
    django.setup()

    from datetime import date, timedelta
    from closet.models import Baby, GrowthRecord, ClothingItem, TransferRecipient, TransferRecord

    if Baby.objects.count() > 0:
        print('数据已存在，跳过初始化')
        return

    baby = Baby.objects.create(
        name='小汤圆',
        gender='F',
        birth_date=date(2025, 8, 20),
        note='可爱的小公主'
    )
    print(f'创建宝宝: {baby.name}')

    base_date = date.today()
    growth_data = [
        (base_date - timedelta(days=270), 50, 3.3),
        (base_date - timedelta(days=180), 62, 6.8),
        (base_date - timedelta(days=90), 70, 8.5),
        (base_date - timedelta(days=30), 73, 9.0),
        (base_date, 75, 9.5),
    ]
    for d, h, w in growth_data:
        GrowthRecord.objects.create(baby=baby, record_date=d, height=h, weight=w)
    print(f'创建成长记录: {len(growth_data)}条')

    items_data = [
        ('小熊连体衣哈衣', 'onesie', '73', 65, 75, 6, 12, 'autumn', 'like_new', '巴拉巴拉', 6),
        ('纯棉短袖T恤', 'tshirt', '80', 75, 85, 9, 18, 'summer', 'good', '优衣库', 3),
        ('粉色公主连衣裙', 'dress', '80', 75, 85, 9, 18, 'summer', 'new', 'Gap', 1),
        ('加绒保暖外套', 'coat', '90', 85, 95, 12, 24, 'winter', 'good', '迪士尼', 0),
        ('纯棉防蚊裤', 'pants', '80', 75, 85, 9, 18, 'spring', 'good', '全棉时代', 2),
        ('软底学步鞋', 'shoes', '22码', 75, 85, 9, 18, 'all', 'like_new', '基诺浦', 1),
        ('纯棉袜子3双装', 'socks', 'S', 70, 85, 6, 18, 'all', 'good', '无印良品', 0),
        ('防晒遮阳帽', 'hat', '48cm', 75, 90, 9, 24, 'summer', 'new', 'Carters', 0),
        ('全棉纱布睡袋', 'sleepwear', '80', 70, 85, 6, 18, 'all', 'good', 'nest', 4),
        ('加厚连体羽绒服', 'onesie', '90', 85, 95, 12, 24, 'winter', 'new', '英氏', 0),
        ('条纹长袖T恤', 'tshirt', '90', 85, 95, 12, 24, 'autumn', 'new', '优衣库', 0),
        ('牛仔背带裤', 'pants', '90', 85, 95, 12, 24, 'autumn', 'new', 'Zara', 0),
        ('加厚连裤袜', 'socks', '90', 85, 100, 12, 24, 'winter', 'good', '小米', 2),
        ('防水冲锋衣外套', 'jacket', '90', 85, 95, 12, 24, 'autumn', 'like_new', '骆驼', 0),
        ('蕾丝公主裙', 'dress', '90', 85, 95, 12, 24, 'spring', 'new', '戴维贝拉', 0),
        ('隔尿护理垫', 'bib', 'M', 60, 90, 3, 24, 'all', 'good', '全棉时代', 5),
        ('纯棉内裤', 'underwear', 'M', 80, 100, 12, 36, 'all', 'new', '小米', 0),
        ('沙滩泳装', 'swimwear', '90', 85, 95, 12, 24, 'summer', 'new', 'Speedo', 0),
        ('卡通图案卫衣', 'hoodie', '80', 75, 85, 9, 18, 'autumn', 'good', 'Gap', 2),
        ('婴儿针织开衫', 'sweater', '73', 65, 75, 6, 12, 'autumn', 'like_new', 'Gap', 8),
    ]

    status_cycle = ['keep', 'keep', 'keep', 'to_give', 'keep', 'keep', 'keep', 'keep',
                    'given', 'keep', 'keep', 'keep', 'to_give', 'keep', 'reserved',
                    'keep', 'keep', 'keep', 'near_limit', 'given']

    for idx, (name, cat, sz, minh, maxh, mina, maxa, sea, cond, brand, age_offset) in enumerate(items_data):
        pdate = base_date - timedelta(days=age_offset * 30) if age_offset > 0 else None
        s = status_cycle[idx % len(status_cycle)]
        if s == 'near_limit':
            s = 'keep'
        item = ClothingItem.objects.create(
            baby=baby,
            name=name,
            category=cat,
            size_type='height',
            size_value=sz,
            size_label=sz,
            min_height=minh,
            max_height=maxh,
            min_age_months=mina,
            max_age_months=maxa,
            season=sea,
            condition=cond,
            brand=brand,
            purchase_date=pdate,
            purchase_price=round(50 + idx * 13.7, 2),
            status=s,
            note=f'示例衣物{idx + 1}',
        )

    recipients_data = [
        ('小橙子妈妈', '闺蜜', '小橙子', '13800000001', '北京市朝阳区'),
        ('乐乐妈', '同事', '乐乐', '13800000002', '上海市浦东新区'),
        ('表妹', '亲戚', '豆豆', '13800000003', '广州市天河区'),
    ]
    recipients = []
    for name, rel, bname, phone, addr in recipients_data:
        r = TransferRecipient.objects.create(
            name=name, relation=rel, baby_name=bname, phone=phone, address=addr
        )
        recipients.append(r)
    print(f'创建转送对象: {len(recipients)}个')

    given_items = ClothingItem.objects.filter(status='given')[:2]
    for idx, item in enumerate(given_items):
        recipient = recipients[idx % len(recipients)]
        TransferRecord.objects.create(
            item=item,
            recipient=recipient,
            recipient_name=recipient.name,
            transfer_date=base_date - timedelta(days=idx * 15 + 5),
            status='completed',
            note=f'{item.name}转送记录'
        )

    reserved_items = ClothingItem.objects.filter(status='reserved')[:1]
    for item in reserved_items:
        recipient = recipients[-1]
        TransferRecord.objects.create(
            item=item,
            recipient=recipient,
            recipient_name=recipient.name,
            transfer_date=base_date + timedelta(days=3),
            status='pending',
            note='预定，下周末交接'
        )

    print('数据初始化完成!')


if __name__ == '__main__':
    init_db_data()
