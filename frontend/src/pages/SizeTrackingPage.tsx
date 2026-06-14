import { useState, useEffect } from 'react'
import BabySelector from '../components/BabySelector'
import { useBaby } from '../App'
import {
  Button, Table, Modal, Form, InputNumber, DatePicker, Input,
  Space, Popconfirm, App as AntdApp, Card, Row, Col
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { api } from '../api'
import type { GrowthRecord } from '../types'
import dayjs from 'dayjs'

export default function SizeTrackingPage() {
  const { selectedBaby } = useBaby()
  const antdApp = AntdApp.useApp()
  const [records, setRecords] = useState<GrowthRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<GrowthRecord | null>(null)
  const [form] = Form.useForm()

  const loadRecords = async () => {
    if (!selectedBaby) return
    setLoading(true)
    try {
      const data = await api.getGrowthRecords({ baby: selectedBaby.id })
      setRecords(data)
    } catch (e) {
      antdApp.message.error('加载成长记录失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRecords()
  }, [selectedBaby])

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({
      record_date: dayjs(),
    })
    setModalOpen(true)
  }

  const openEdit = (r: GrowthRecord) => {
    setEditing(r)
    form.setFieldsValue({
      ...r,
      record_date: dayjs(r.record_date),
    })
    setModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await api.deleteGrowthRecord(id)
      antdApp.message.success('删除成功')
      loadRecords()
    } catch (e) {
      antdApp.message.error('删除失败')
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        baby: selectedBaby?.id,
        record_date: values.record_date.format('YYYY-MM-DD'),
      }
      if (editing) {
        await api.updateGrowthRecord(editing.id, data)
        antdApp.message.success('更新成功')
      } else {
        await api.createGrowthRecord(data)
        antdApp.message.success('创建成功')
      }
      setModalOpen(false)
      loadRecords()
    } catch (e) {
      antdApp.message.error('操作失败')
    }
  }

  const sortedRecords = [...records].sort(
    (a, b) => dayjs(a.record_date).valueOf() - dayjs(b.record_date).valueOf()
  )

  const chartData = sortedRecords.map((r) => ({
    date: dayjs(r.record_date).format('MM-DD'),
    身高: r.height,
    体重: r.weight,
    头围: r.head_circumference,
  }))

  const latest = sortedRecords[sortedRecords.length - 1]
  const previous = sortedRecords[sortedRecords.length - 2]

  const calcChange = (curr?: number, prev?: number) => {
    if (curr == null || prev == null) return null
    return (curr - prev).toFixed(1)
  }

  const columns = [
    {
      title: '记录日期',
      dataIndex: 'record_date',
      width: 130,
      sorter: (a: GrowthRecord, b: GrowthRecord) =>
        dayjs(a.record_date).valueOf() - dayjs(b.record_date).valueOf(),
    },
    {
      title: '身高 (cm)',
      dataIndex: 'height',
      width: 120,
      render: (v: number) => <span style={{ fontWeight: 600, color: '#1677ff' }}>{v}</span>,
    },
    {
      title: '体重 (kg)',
      dataIndex: 'weight',
      width: 120,
      render: (v: number) => <span style={{ fontWeight: 600, color: '#52c41a' }}>{v}</span>,
    },
    {
      title: '头围 (cm)',
      dataIndex: 'head_circumference',
      width: 120,
      render: (v?: number) => v || '-',
    },
    {
      title: '备注',
      dataIndex: 'note',
      render: (v?: string) => v || '-',
    },
    {
      title: '操作',
      width: 160,
      fixed: 'right' as const,
      render: (_: any, r: GrowthRecord) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(r.id)} okText="删除" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <BabySelector
      title="尺码追踪"
      description="记录宝宝的身高、体重、头围等成长数据，系统结合这些数据判断每件衣物的合身程度，自动预警不合身衣物。"
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col span={6}>
          <Card size="small">
            <div style={{ color: '#888', fontSize: 12 }}>最新身高</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: '#1677ff' }}>
                {latest?.height || '-'}
              </span>
              <span style={{ color: '#888', fontSize: 12 }}>cm</span>
              {calcChange(latest?.height, previous?.height) != null && (
                <TagDelta value={calcChange(latest!.height, previous!.height)} />
              )}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <div style={{ color: '#888', fontSize: 12 }}>最新体重</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: '#52c41a' }}>
                {latest?.weight || '-'}
              </span>
              <span style={{ color: '#888', fontSize: 12 }}>kg</span>
              {calcChange(latest?.weight, previous?.weight) != null && (
                <TagDelta value={calcChange(latest!.weight, previous!.weight)} />
              )}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <div style={{ color: '#888', fontSize: 12 }}>成长记录数</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#c2185b' }}>
              {records.length}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <div style={{ color: '#888', fontSize: 12 }}>测量周期</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#722ed1' }}>
              {sortedRecords.length >= 2
                ? Math.round(
                    dayjs(latest!.record_date).diff(dayjs(sortedRecords[0].record_date), 'day') /
                      (sortedRecords.length - 1)
                  )
                : '-'}
              <span style={{ fontSize: 14, color: '#888' }}> 天/次</span>
            </div>
          </Card>
        </Col>
      </Row>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 className="section-title">📈 成长曲线</h3>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新增记录
        </Button>
      </div>

      <div className="chart-card" style={{ marginBottom: 24 }}>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" fontSize={12} />
            <YAxis yAxisId="left" fontSize={12} label={{ value: '身高/头围(cm)', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#888' } }} />
            <YAxis yAxisId="right" orientation="right" fontSize={12} label={{ value: '体重(kg)', angle: 90, position: 'insideRight', style: { fontSize: 12, fill: '#888' } }} />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="身高" stroke="#1677ff" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} />
            <Line yAxisId="right" type="monotone" dataKey="体重" stroke="#52c41a" strokeWidth={3} dot={{ r: 5 }} />
            <Line yAxisId="left" type="monotone" dataKey="头围" stroke="#722ed1" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <h3 className="section-title">📋 记录详情</h3>
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={sortedRecords.slice().reverse()}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editing ? '编辑成长记录' : '新增成长记录'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        okText={editing ? '保存' : '创建'}
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="record_date" label="记录日期" rules={[{ required: true, message: '必填' }]}>
            <DatePicker style={{ width: '100%' }} disabledDate={(d) => d && d.isAfter(dayjs())} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="height" label="身高 (cm)" rules={[{ required: true, message: '必填' }]}>
                <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="weight" label="体重 (kg)" rules={[{ required: true, message: '必填' }]}>
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="head_circumference" label="头围 (cm)">
                <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </BabySelector>
  )
}

function TagDelta({ value }: { value: string | null }) {
  if (value == null) return null
  const num = parseFloat(value)
  if (num > 0) {
    return <span style={{ color: '#52c41a', fontSize: 12 }}>+{value}</span>
  }
  return <span style={{ color: '#ff4d4f', fontSize: 12 }}>{value}</span>
}
