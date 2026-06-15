import { useState, useEffect } from 'react'
import BabySelector from '../components/BabySelector'
import { useBaby } from '../App'
import {
  Button, Table, Tag, Modal, Form, Input, Select, InputNumber,
  DatePicker, Space, Popconfirm, App as AntdApp, Card, Row, Col, Image, Tooltip
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, GiftOutlined } from '@ant-design/icons'
import {
  api, categoryOptions, seasonOptions, conditionOptions,
  statusOptions, statusOptionsWithLent, sizeTypeOptions, borrowStatusOptions,
} from '../api'
import type { ClothingItem } from '../types'
import dayjs from 'dayjs'

const statusColorMap: Record<string, string> = {
  keep: 'default',
  to_give: 'orange',
  reserved: 'purple',
  given: 'green',
  lent: 'cyan',
}

const fitTagMap: Record<string, { label: string; cls: string }> = {
  too_small: { label: '不合身', cls: 'tag-too-small' },
  near_limit: { label: '即将不合身', cls: 'tag-near-limit' },
  fits: { label: '合身', cls: 'tag-fits' },
  too_big: { label: '偏大', cls: 'tag-too-big' },
}

export default function ClothingPage() {
  const { selectedBaby } = useBaby()
  const antdApp = AntdApp.useApp()
  const [items, setItems] = useState<ClothingItem[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ClothingItem | null>(null)
  const [filters, setFilters] = useState<{ category?: string; status?: string; season?: string }>({})
  const [form] = Form.useForm()

  const loadItems = async () => {
    if (!selectedBaby) return
    setLoading(true)
    try {
      const params: Record<string, any> = { baby: selectedBaby.id }
      if (filters.category) params.category = filters.category
      if (filters.status) params.status = filters.status
      if (filters.season) params.season = filters.season
      const data = await api.getClothingItems(params)
      setItems(data)
    } catch (e) {
      antdApp.message.error('加载物品失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
  }, [selectedBaby, filters])

  const openCreate = () => {
    setEditingItem(null)
    form.resetFields()
    form.setFieldsValue({
      baby: selectedBaby?.id,
      size_type: 'height',
      condition: 'good',
      status: 'keep',
      season: 'all',
      min_age_months: 0,
      max_age_months: 12,
    })
    setModalOpen(true)
  }

  const openEdit = (item: ClothingItem) => {
    setEditingItem(item)
    form.setFieldsValue({
      ...item,
      purchase_date: item.purchase_date ? dayjs(item.purchase_date) : null,
    })
    setModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await api.deleteClothingItem(id)
      antdApp.message.success('删除成功')
      loadItems()
    } catch (e) {
      antdApp.message.error('删除失败')
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        baby: selectedBaby?.id,
        size_label: values.size_label || values.size_value,
        purchase_date: values.purchase_date ? values.purchase_date.format('YYYY-MM-DD') : null,
      }
      if (editingItem) {
        await api.updateClothingItem(editingItem.id, data)
        antdApp.message.success('更新成功')
      } else {
        await api.createClothingItem(data)
        antdApp.message.success('创建成功')
      }
      setModalOpen(false)
      form.resetFields()
      loadItems()
    } catch (e: any) {
      antdApp.message.error(editingItem ? '更新失败' : '创建失败')
    }
  }

  const markToGive = async (item: ClothingItem) => {
    if (item.status === 'lent') {
      antdApp.message.warning('该衣物处于借出中状态，无法执行转送操作，请先归还')
      return
    }
    try {
      await api.updateClothingItem(item.id, { status: 'to_give' })
      antdApp.message.success('已标记为待转送')
      loadItems()
    } catch (e) {
      antdApp.message.error('操作失败')
    }
  }

  const columns = [
    {
      title: '物品',
      dataIndex: 'name',
      render: (v: string, r: ClothingItem) => (
        <div>
          <div style={{ fontWeight: 500 }}>{v}</div>
          <div style={{ color: '#888', fontSize: 12 }}>{r.brand || '未填品牌'}</div>
        </div>
      ),
    },
    {
      title: '品类',
      dataIndex: 'category_display',
      width: 90,
    },
    {
      title: '尺码',
      dataIndex: 'size_label',
      width: 100,
      render: (v: string, r: ClothingItem) => (
        <div>
          <Tag color="blue">{v}</Tag>
          <div style={{ color: '#888', fontSize: 11, marginTop: 4 }}>
            身高{r.min_height}-{r.max_height}cm
          </div>
        </div>
      ),
    },
    {
      title: '月龄',
      width: 110,
      render: (_: any, r: ClothingItem) => (
        <Tag>{r.min_age_months}-{r.max_age_months}月</Tag>
      ),
    },
    {
      title: '季节',
      dataIndex: 'season_display',
      width: 90,
    },
    {
      title: '成色',
      dataIndex: 'condition_display',
      width: 90,
    },
    {
      title: '合身度',
      width: 110,
      render: (_: any, r: ClothingItem) => {
        const info = fitTagMap[r.fit_status || 'unknown']
        if (!info) return <span style={{ color: '#999' }}>-</span>
        return (
          <div>
            <Tag className={info.cls}>{info.label}</Tag>
          </div>
        )
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 140,
      render: (v: string, r: ClothingItem) => (
        <div>
          <Tag color={statusColorMap[v] || 'default'}>{r.status_display}</Tag>
          {r.status === 'lent' && r.current_borrow && (
            <div style={{ marginTop: 4, fontSize: 11, color: '#888' }}>
              借予：{r.current_borrow.borrower_name}
              {r.current_borrow.expected_return_date && (
                <div>预计归还：{r.current_borrow.expected_return_date}</div>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '购入时间',
      dataIndex: 'purchase_date',
      width: 110,
      render: (v: string) => v || '-',
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, r: ClothingItem) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
          {r.status === 'keep' && (
            <Button type="link" size="small" icon={<GiftOutlined />} onClick={() => markToGive(r)}>转送</Button>
          )}
          {r.status === 'lent' && (
            <Tooltip title="借出中衣物暂不可转送">
              <Button type="link" size="small" icon={<GiftOutlined />} disabled>转送</Button>
            </Tooltip>
          )}
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(r.id)} okText="删除" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <BabySelector
      title="物品档案"
      description="为每件衣物建档，记录品类、尺码、季节、成色、品牌、购入时间和适合月龄，追踪物品流转状态。"
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <div style={{ color: '#888', fontSize: 12 }}>物品总数</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#c2185b' }}>{items.length}</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <div style={{ color: '#888', fontSize: 12 }}>借出中</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#13c2c2' }}>
              {items.filter(i => i.status === 'lent').length}
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <div style={{ color: '#888', fontSize: 12 }}>待转送</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#d46b08' }}>
              {items.filter(i => i.status === 'to_give').length}
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <div style={{ color: '#888', fontSize: 12 }}>已送出</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#389e0d' }}>
              {items.filter(i => i.status === 'given').length}
            </div>
          </Card>
        </Col>
      </Row>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <Select
          placeholder="筛选品类"
          allowClear
          style={{ width: 140 }}
          options={categoryOptions}
          value={filters.category || undefined}
          onChange={(v) => setFilters({ ...filters, category: v })}
        />
        <Select
          placeholder="筛选状态"
          allowClear
          style={{ width: 140 }}
          options={statusOptionsWithLent}
          value={filters.status || undefined}
          onChange={(v) => setFilters({ ...filters, status: v })}
        />
        <Select
          placeholder="筛选季节"
          allowClear
          style={{ width: 140 }}
          options={seasonOptions}
          value={filters.season || undefined}
          onChange={(v) => setFilters({ ...filters, season: v })}
        />
        <div style={{ flex: 1 }} />
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          添加衣物
        </Button>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={items}
        scroll={{ x: 1200 }}
        pagination={{ pageSize: 10, showSizeChanger: true }}
      />

      <Modal
        title={editingItem ? '编辑衣物档案' : '添加衣物档案'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        width={760}
        okText={editingItem ? '保存' : '创建'}
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="物品名称" rules={[{ required: true, message: '必填' }]}>
                <Input placeholder="如：小熊连体衣" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="brand" label="品牌">
                <Input placeholder="品牌名称" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="category" label="品类" rules={[{ required: true }]}>
                <Select options={categoryOptions} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="season" label="适用季节" rules={[{ required: true }]}>
                <Select options={seasonOptions} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="condition" label="成色" rules={[{ required: true }]}>
                <Select options={conditionOptions} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="size_type" label="尺码类型" rules={[{ required: true }]}>
                <Select options={sizeTypeOptions} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="size_value" label="尺码值" rules={[{ required: true, message: '必填' }]}>
                <Input placeholder="如：73、80、90" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="size_label" label="展示标签（可选）">
                <Input placeholder="默认与尺码值相同" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="适合身高范围 (cm)">
                <Space.Compact style={{ width: '100%' }}>
                  <Form.Item name="min_height" noStyle rules={[{ required: true }]}>
                    <InputNumber min={0} placeholder="最小" style={{ width: '50%' }} />
                  </Form.Item>
                  <Form.Item name="max_height" noStyle rules={[{ required: true }]}>
                    <InputNumber min={0} placeholder="最大" style={{ width: '50%' }} />
                  </Form.Item>
                </Space.Compact>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="适合月龄范围 (月)">
                <Space.Compact style={{ width: '100%' }}>
                  <Form.Item name="min_age_months" noStyle rules={[{ required: true }]}>
                    <InputNumber min={0} placeholder="最小" style={{ width: '50%' }} />
                  </Form.Item>
                  <Form.Item name="max_age_months" noStyle rules={[{ required: true }]}>
                    <InputNumber min={0} placeholder="最大" style={{ width: '50%' }} />
                  </Form.Item>
                </Space.Compact>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="status"
                label="当前状态"
                rules={[{ required: true }]}
                extra={
                  editingItem?.status === 'lent'
                    ? '⚠️ 借出中衣物请在借穿管理页操作归还'
                    : !editingItem
                    ? '💡 如需借出，请先创建衣物再到借穿管理页登记'
                    : ''
                }
              >
                <Select
                  options={editingItem?.status === 'lent' ? statusOptionsWithLent : statusOptions}
                  disabled={editingItem?.status === 'lent'}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="purchase_date" label="购入时间">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="purchase_price" label="购入价格 (元)">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="image_url" label="图片链接（可选）">
            <Input placeholder="图片URL" />
          </Form.Item>
        </Form>
      </Modal>
    </BabySelector>
  )
}
