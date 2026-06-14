import { useState, useEffect } from 'react'
import BabySelector from '../components/BabySelector'
import { useBaby } from '../App'
import {
  Button, Table, Modal, Form, Input, Select, DatePicker,
  Space, Popconfirm, App as AntdApp, Card, Row, Col, Tag
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, UserAddOutlined
} from '@ant-design/icons'
import { api } from '../api'
import type { TransferRecord, TransferRecipient, ClothingItem } from '../types'
import dayjs from 'dayjs'

const statusColor: Record<string, string> = {
  pending: 'orange',
  completed: 'green',
  cancelled: 'default',
}

const statusLabel: Record<string, string> = {
  pending: '待交接',
  completed: '已完成',
  cancelled: '已取消',
}

export default function TransferPage() {
  const { selectedBaby } = useBaby()
  const antdApp = AntdApp.useApp()
  const [records, setRecords] = useState<TransferRecord[]>([])
  const [recipients, setRecipients] = useState<TransferRecipient[]>([])
  const [items, setItems] = useState<ClothingItem[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [recipientModalOpen, setRecipientModalOpen] = useState(false)
  const [editing, setEditing] = useState<TransferRecord | null>(null)
  const [form] = Form.useForm()
  const [recipientForm] = Form.useForm()

  const loadData = async () => {
    if (!selectedBaby) return
    setLoading(true)
    try {
      const [r, recs, its] = await Promise.all([
        api.getTransferRecords(),
        api.getTransferRecipients(),
        api.getClothingItems({ baby: selectedBaby.id }),
      ])
      setRecords(r.filter(x => items.length ? true : true))
      setRecipients(recs)
      setItems(its)
    } catch (e) {
      antdApp.message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedBaby])

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({
      transfer_date: dayjs(),
      status: 'completed',
    })
    setModalOpen(true)
  }

  const openEdit = (r: TransferRecord) => {
    setEditing(r)
    form.setFieldsValue({
      ...r,
      transfer_date: dayjs(r.transfer_date),
      recipient: r.recipient,
    })
    setModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await api.deleteTransferRecord(id)
      antdApp.message.success('删除成功')
      loadData()
    } catch (e) {
      antdApp.message.error('删除失败')
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      const recipientId = values.recipient
      const recipientInfo = recipients.find(r => r.id === recipientId)
      const data = {
        ...values,
        transfer_date: values.transfer_date.format('YYYY-MM-DD'),
        recipient_name: recipientInfo?.name || values.recipient_name || '',
        recipient: recipientId || null,
      }
      if (editing) {
        await api.updateTransferRecord(editing.id, data)
        antdApp.message.success('更新成功')
      } else {
        await api.createTransferRecord(data)
        if (values.item && data.status === 'completed') {
          await api.updateClothingItem(values.item, { status: 'given' })
        }
        antdApp.message.success('创建成功')
      }
      setModalOpen(false)
      loadData()
    } catch (e) {
      antdApp.message.error('操作失败')
    }
  }

  const handleRecipientSubmit = async (values: any) => {
    try {
      const r = await api.createTransferRecipient(values)
      setRecipients([...recipients, r])
      antdApp.message.success('添加转送对象成功')
      setRecipientModalOpen(false)
      recipientForm.resetFields()
    } catch (e) {
      antdApp.message.error('添加失败')
    }
  }

  const availableItems = items.filter(
    (i) => ['keep', 'to_give', 'reserved'].includes(i.status) || editing?.item === i.id
  )

  const columns = [
    {
      title: '物品',
      render: (_: any, r: TransferRecord) => (
        <div>
          <div style={{ fontWeight: 500 }}>{r.item_name || `#${r.item}`}</div>
          <div style={{ color: '#888', fontSize: 12 }}>{r.item_size || ''}</div>
        </div>
      ),
    },
    {
      title: '转送对象',
      render: (_: any, r: TransferRecord) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            {r.recipient_info?.name || r.recipient_name || '-'}
          </div>
          {r.recipient_info?.baby_name && (
            <div style={{ color: '#888', fontSize: 12 }}>送给宝宝：{r.recipient_info.baby_name}</div>
          )}
          {r.recipient_info?.relation && (
            <Tag style={{ marginTop: 4 }}>{r.recipient_info.relation}</Tag>
          )}
        </div>
      ),
    },
    {
      title: '交接时间',
      dataIndex: 'transfer_date',
      width: 130,
      sorter: (a, b) => dayjs(a.transfer_date).valueOf() - dayjs(b.transfer_date).valueOf(),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v, r) => (
        <Tag color={statusColor[v] || 'default'}>{r.status_display || statusLabel[v]}</Tag>
      ),
    },
    {
      title: '联系方式',
      render: (_: any, r: TransferRecord) => (
        <span style={{ color: '#666' }}>{r.recipient_info?.phone || '-'}</span>
      ),
    },
    {
      title: '备注',
      dataIndex: 'note',
      render: (v: string) => v || '-',
    },
    {
      title: '操作',
      width: 160,
      fixed: 'right' as const,
      render: (_: any, r: TransferRecord) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(r.id)} okText="删除" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const completedCount = records.filter(r => r.status === 'completed').length
  const totalItems = items.length
  const transferRate = totalItems > 0 ? Math.round((records.filter(r => r.status === 'completed').length / totalItems) * 100) : 0

  return (
    <BabySelector
      title="转送记录"
      description="管理衣物转送对象和交接记录。物品送出后自动更新状态为「已送出」，实现闲置衣物从识别到送出的完整闭环。"
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col span={6}>
          <Card size="small">
            <div style={{ color: '#888', fontSize: 12 }}>转送记录总数</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#c2185b' }}>{records.length}</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <div style={{ color: '#888', fontSize: 12 }}>已完成转送</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#389e0d' }}>{completedCount}</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <div style={{ color: '#888', fontSize: 12 }}>转送对象数</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#1677ff' }}>{recipients.length}</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <div style={{ color: '#888', fontSize: 12 }}>转送占比</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#722ed1' }}>{transferRate}%</div>
          </Card>
        </Col>
      </Row>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 className="section-title">📦 转送记录</h3>
        <Space>
          <Button icon={<UserAddOutlined />} onClick={() => setRecipientModalOpen(true)}>
            管理转送对象
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增转送
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={records}
        scroll={{ x: 1000 }}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editing ? '编辑转送记录' : '新增转送记录'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        width={640}
        okText={editing ? '保存' : '创建'}
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="item" label="转送物品" rules={[{ required: true, message: '请选择' }]}>
            <Select
              placeholder="选择要转送的物品"
              options={availableItems.map((i) => ({
                value: i.id,
                label: `${i.name}（${i.size_label || i.size_value}）- ${i.category_display}`,
              }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="recipient" label="转送对象" rules={[{ required: true, message: '请选择' }]}>
                <Select
                  placeholder="选择转送对象"
                  options={recipients.map((r) => ({
                    value: r.id,
                    label: `${r.name}${r.relation ? `（${r.relation}）` : ''}${r.baby_name ? ` - ${r.baby_name}` : ''}`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label=" " colon={false} style={{ marginBottom: 24 }}>
                <Button block onClick={() => setRecipientModalOpen(true)}>
                  新增对象
                </Button>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="transfer_date" label="交接时间" rules={[{ required: true, message: '必填' }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: 'pending', label: '待交接' },
                    { value: 'completed', label: '已完成' },
                    { value: 'cancelled', label: '已取消' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={2} placeholder="交接方式、特殊说明等" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="添加转送对象"
        open={recipientModalOpen}
        onCancel={() => setRecipientModalOpen(false)}
        onOk={() => recipientForm.submit()}
        okText="添加"
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={recipientForm} layout="vertical" onFinish={handleRecipientSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="接收人姓名" rules={[{ required: true, message: '必填' }]}>
                <Input placeholder="如：小橙子妈妈" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="relation" label="与您关系">
                <Input placeholder="如：闺蜜/同事/亲戚" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="baby_name" label="对方宝宝姓名">
                <Input placeholder="如：小橙子" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="联系方式">
                <Input placeholder="手机号" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="address" label="地址">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>

        {recipients.length > 0 && (
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px dashed #eee' }}>
            <div style={{ marginBottom: 8, fontWeight: 600, color: '#666', fontSize: 13 }}>已有转送对象</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {recipients.map((r) => (
                <Tag key={r.id} color="blue">
                  {r.name}{r.relation ? `（${r.relation}）` : ''}
                </Tag>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </BabySelector>
  )
}
