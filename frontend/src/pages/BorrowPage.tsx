import { useState, useEffect, useMemo } from 'react'
import BabySelector from '../components/BabySelector'
import { useBaby } from '../App'
import {
  Button, Table, Tag, Modal, Form, Input, Select, InputNumber,
  DatePicker, Space, Popconfirm, App as AntdApp, Card, Row, Col,
  Tabs, Alert, Statistic, Progress, List, Empty, Divider, Radio,
  Tooltip, Badge, message, Descriptions,
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ArrowUpOutlined,
  ArrowDownOutlined, CalendarOutlined, ExclamationCircleOutlined,
  CheckCircleOutlined, ClockCircleOutlined, UserOutlined,
  ReloadOutlined, EyeOutlined, BarChartOutlined,
} from '@ant-design/icons'
import {
  api, relationOptions, borrowStatusOptions, borrowStatusGroupOptions,
  washStatusOptions, conditionChangeOptions, conditionOptions,
  categoryOptions, careStatusOptions, careStatusTagColors,
} from '../api'
import type {
  BorrowObject, BorrowRecord, ClothingItem, BorrowStatistics,
} from '../types'
import dayjs from 'dayjs'

const { TabPane } = Tabs
const { RangePicker } = DatePicker
const { Option } = Select
const { TextArea } = Input

const borrowStatusColorMap: Record<string, string> = {
  borrowed: 'processing',
  overdue: 'error',
  returned: 'success',
  returned_damaged: 'warning',
}

const washStatusColorMap: Record<string, string> = {
  unwashed: 'default',
  washed: 'success',
  to_wash: 'warning',
}

export default function BorrowPage() {
  const { selectedBaby } = useBaby()
  const antdApp = AntdApp.useApp()

  const [activeTab, setActiveTab] = useState<'records' | 'objects' | 'stats'>('records')
  const [borrowRecords, setBorrowRecords] = useState<BorrowRecord[]>([])
  const [borrowObjects, setBorrowObjects] = useState<BorrowObject[]>([])
  const [borrowStatistics, setBorrowStatistics] = useState<BorrowStatistics | null>(null)
  const [loading, setLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)

  const [borrowForm] = Form.useForm()
  const [objectForm] = Form.useForm()
  const [returnForm] = Form.useForm()

  const [borrowModalOpen, setBorrowModalOpen] = useState(false)
  const [objectModalOpen, setObjectModalOpen] = useState(false)
  const [returnModalOpen, setReturnModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)

  const [editingObject, setEditingObject] = useState<BorrowObject | null>(null)
  const [returningRecord, setReturningRecord] = useState<BorrowRecord | null>(null)
  const [viewingRecord, setViewingRecord] = useState<BorrowRecord | null>(null)

  const [availableItems, setAvailableItems] = useState<ClothingItem[]>([])
  const [filters, setFilters] = useState<{
    status_group?: string
    borrower?: number
    status?: string
  }>({})

  const loadData = async () => {
    if (!selectedBaby) return
    setLoading(true)
    try {
      const params: Record<string, any> = { baby: selectedBaby.id }
      if (filters.status_group) params.status_group = filters.status_group
      if (filters.borrower) params.borrower = filters.borrower
      if (filters.status) params.status = filters.status

      const [records, objects, items] = await Promise.all([
        api.getBorrowRecords(params),
        api.getBorrowObjects(),
        api.getClothingItems({ baby: selectedBaby.id, status: 'keep' }),
      ])
      setBorrowRecords(records)
      setBorrowObjects(objects)
      setAvailableItems(items)
    } catch (e) {
      antdApp.message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const loadStatistics = async () => {
    if (!selectedBaby) return
    setStatsLoading(true)
    try {
      const stats = await api.getBorrowStatistics(selectedBaby.id)
      setBorrowStatistics(stats)
    } catch (e) {
      antdApp.message.error('加载统计数据失败')
    } finally {
      setStatsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedBaby, filters])

  useEffect(() => {
    if (activeTab === 'stats') {
      loadStatistics()
    }
  }, [selectedBaby, activeTab])

  const openBorrowModal = () => {
    borrowForm.resetFields()
    borrowForm.setFieldsValue({
      borrow_date: dayjs(),
      wash_status: 'unwashed',
      status: 'borrowed',
    })
    setBorrowModalOpen(true)
  }

  const handleBorrowSubmit = async (values: any) => {
    try {
      const item = availableItems.find(i => i.id === values.item)
      const data = {
        ...values,
        borrow_date: values.borrow_date.format('YYYY-MM-DD'),
        expected_return_date: values.expected_return_date ? values.expected_return_date.format('YYYY-MM-DD') : null,
        original_condition: item?.condition || 'good',
      }
      await api.createBorrowRecord(data)
      antdApp.message.success('借出登记成功')
      setBorrowModalOpen(false)
      borrowForm.resetFields()
      loadData()
    } catch (e: any) {
      antdApp.message.error('登记失败：' + (e.response?.data?.detail || e.message))
    }
  }

  const openObjectModal = (obj?: BorrowObject) => {
    setEditingObject(obj || null)
    objectForm.resetFields()
    if (obj) {
      objectForm.setFieldsValue({
        ...obj,
        baby_birth_date: obj.baby_birth_date ? dayjs(obj.baby_birth_date) : null,
      })
    } else {
      objectForm.setFieldsValue({
        baby_gender: 'U',
      })
    }
    setObjectModalOpen(true)
  }

  const handleObjectSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        baby_birth_date: values.baby_birth_date ? values.baby_birth_date.format('YYYY-MM-DD') : null,
      }
      if (editingObject) {
        await api.updateBorrowObject(editingObject.id, data)
        antdApp.message.success('更新成功')
      } else {
        await api.createBorrowObject(data)
        antdApp.message.success('创建成功')
      }
      setObjectModalOpen(false)
      objectForm.resetFields()
      loadData()
    } catch (e: any) {
      antdApp.message.error('操作失败：' + (e.response?.data?.detail || e.message))
    }
  }

  const handleDeleteObject = async (id: number) => {
    try {
      await api.deleteBorrowObject(id)
      antdApp.message.success('删除成功')
      loadData()
    } catch (e) {
      antdApp.message.error('删除失败')
    }
  }

  const openReturnModal = (record: BorrowRecord) => {
    setReturningRecord(record)
    returnForm.resetFields()
    returnForm.setFieldsValue({
      actual_return_date: dayjs(),
      return_condition: record.original_condition,
      condition_change: 'same',
      wash_status: 'washed',
      suggest_transfer: false,
      status: 'returned',
    })
    setReturnModalOpen(true)
  }

  const handleReturnSubmit = async (values: any) => {
    if (!returningRecord) return
    try {
      const data = {
        ...values,
        actual_return_date: values.actual_return_date ? values.actual_return_date.format('YYYY-MM-DD') : null,
      }
      const result = await api.returnBorrowRecord(returningRecord.id, data)
      antdApp.message.success(result.message)
      if (result.suggest_transfer) {
        antdApp.message.info('已根据成色变化建议转送该物品')
      }
      setReturnModalOpen(false)
      returnForm.resetFields()
      loadData()
    } catch (e: any) {
      antdApp.message.error('归还失败：' + (e.response?.data?.detail || e.message))
    }
  }

  const openDetailModal = (record: BorrowRecord) => {
    setViewingRecord(record)
    setDetailModalOpen(true)
  }

  const overdueCount = useMemo(() =>
    borrowRecords.filter(r => r.status === 'overdue').length
  , [borrowRecords])

  const activeCount = useMemo(() =>
    borrowRecords.filter(r => r.status === 'borrowed').length
  , [borrowRecords])

  if (!selectedBaby) {
    return (
      <BabySelector title="借穿管理" description="管理宝宝衣物的临时借出和归还，支持借穿对象管理、借出登记、归还检查、逾期提醒和成色对比。">
        <Empty description="请先选择宝宝" />
      </BabySelector>
    )
  }

  const recordColumns = [
    {
      title: '物品',
      dataIndex: 'item_name',
      render: (v: string, r: BorrowRecord) => (
        <div>
          <div style={{ fontWeight: 500 }}>{v}</div>
          <div style={{ color: '#888', fontSize: 12 }}>
            {r.item_category} · {r.item_size_label}
          </div>
        </div>
      ),
    },
    {
      title: '借穿对象',
      dataIndex: 'borrower_name',
      render: (v: string, r: BorrowRecord) => (
        <div>
          <div>{v}</div>
          {r.baby_name && (
            <div style={{ color: '#888', fontSize: 12 }}>宝宝：{r.baby_name}</div>
          )}
        </div>
      ),
    },
    {
      title: '借出时间',
      dataIndex: 'borrow_date',
      width: 110,
    },
    {
      title: '预计归还',
      dataIndex: 'expected_return_date',
      width: 110,
      render: (v: string, r: BorrowRecord) => {
        if (!v) return <span style={{ color: '#999' }}>-</span>
        const isOverdue = r.is_overdue
        return (
          <div>
            <div>{v}</div>
            {isOverdue && r.status === 'borrowed' && (
              <Tag color="red" style={{ marginTop: 4 }}>
                逾期{r.days_overdue}天
              </Tag>
            )}
          </div>
        )
      },
    },
    {
      title: '借出时长',
      dataIndex: 'days_borrowed',
      width: 100,
      render: (v: number, r: BorrowRecord) => {
        if (r.status === 'returned' || r.status === 'returned_damaged') {
          return <span>{v}天</span>
        }
        return <span style={{ color: '#1890ff' }}>{v}天（进行中）</span>
      },
    },
    {
      title: '成色变化',
      dataIndex: 'condition_change',
      width: 110,
      render: (v: string, r: BorrowRecord) => {
        if (!r.actual_return_date) return <span style={{ color: '#999' }}>-</span>
        return (
          <div>
            <Tag color={v === 'same' ? 'green' : v === 'damaged' ? 'red' : 'orange'}>
              {r.condition_change_display}
            </Tag>
          </div>
        )
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (v: string, r: BorrowRecord) => (
        <Badge status={borrowStatusColorMap[v] as any} text={r.status_display} />
      ),
    },
    {
      title: '护理状态',
      width: 110,
      render: (_: any, r: BorrowRecord) => {
        if ((r.status === 'borrowed' || r.status === 'overdue')) {
          return <Tag color="cyan">穿着中</Tag>
        }
        if (!r.item_care_status) return <span style={{ color: '#999' }}>-</span>
        return (
          <Tag color={careStatusTagColors[r.item_care_status] || 'default'}>
            {r.item_care_status_display || r.item_care_status}
          </Tag>
        )
      },
    },
    {
      title: '清洗状态',
      width: 100,
      render: (_: any, r: BorrowRecord) => {
        if (r.status === 'borrowed' || r.status === 'overdue') return <span style={{ color: '#999' }}>-</span>
        return <Tag color={washStatusColorMap[r.wash_status] || 'default'}>{r.wash_status_display}</Tag>
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      render: (_: any, r: BorrowRecord) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetailModal(r)}>
            详情
          </Button>
          {(r.status === 'borrowed' || r.status === 'overdue') && (
            <Button type="link" size="small" icon={<ArrowDownOutlined />} onClick={() => openReturnModal(r)}>
              归还
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const objectColumns = [
    {
      title: '借穿人',
      dataIndex: 'name',
      width: 120,
    },
    {
      title: '关系',
      dataIndex: 'relation_display',
      width: 100,
    },
    {
      title: '对方宝宝',
      dataIndex: 'baby_name',
      width: 120,
    },
    {
      title: '联系方式',
      dataIndex: 'phone',
      width: 130,
    },
    {
      title: '借穿次数',
      dataIndex: 'borrow_count',
      width: 100,
      render: (v: number, r: BorrowObject) => (
        <div>
          <div>共{v}次</div>
          {r.current_borrow_count && r.current_borrow_count > 0 && (
            <Tag color="processing" style={{ marginTop: 4 }}>
              {r.current_borrow_count}件借出中
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_: any, r: BorrowObject) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openObjectModal(r)}>
            编辑
          </Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDeleteObject(r.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const stats = borrowStatistics
  const recent30 = stats?.recent_30days

  return (
    <BabySelector
      title="借穿管理"
      description="管理宝宝衣物的临时借出和归还，支持借穿对象管理、借出登记、归还检查、逾期提醒和成色对比，形成完整的衣物流转闭环。"
    >
      {overdueCount > 0 && (
        <Alert
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          message={`有 ${overdueCount} 件衣物已逾期未还，请及时提醒归还`}
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="借出中"
              value={activeCount}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="逾期未还"
              value={overdueCount}
              valueStyle={{ color: overdueCount > 0 ? '#ff4d4f' : '#52c41a' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="本月借出"
              value={recent30?.borrowed_count || 0}
              valueStyle={{ color: '#722ed1' }}
              prefix={<ArrowUpOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="按时归还率"
              value={recent30?.on_time_return_rate || 0}
              suffix="%"
              valueStyle={{ color: recent30 && recent30.on_time_return_rate >= 80 ? '#52c41a' : '#fa8c16' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={(k) => setActiveTab(k as any)}>
        <TabPane tab="借穿记录" key="records">
          <Card size="small" style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]} align="middle">
              <Col>
                <Radio.Group
                  value={filters.status_group || 'all'}
                  onChange={(e) => setFilters({ ...filters, status_group: e.target.value })}
                  optionType="button"
                >
                  {borrowStatusGroupOptions.map(opt => (
                    <Radio.Button key={opt.value} value={opt.value}>
                      {opt.label}
                    </Radio.Button>
                  ))}
                </Radio.Group>
              </Col>
              <Col>
                <Select
                  placeholder="借穿对象"
                  style={{ width: 150 }}
                  allowClear
                  value={filters.borrower || undefined}
                  onChange={(v) => setFilters({ ...filters, borrower: v })}
                >
                  {borrowObjects.map(obj => (
                    <Option key={obj.id} value={obj.id}>{obj.name}</Option>
                  ))}
                </Select>
              </Col>
              <Col>
                <Select
                  placeholder="状态"
                  style={{ width: 130 }}
                  allowClear
                  value={filters.status || undefined}
                  onChange={(v) => setFilters({ ...filters, status: v })}
                >
                  {borrowStatusOptions.map(opt => (
                    <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                  ))}
                </Select>
              </Col>
              <Col flex="auto" style={{ textAlign: 'right' }}>
                <Space>
                  <Button icon={<ReloadOutlined />} onClick={loadData}>
                    刷新
                  </Button>
                  <Button type="primary" icon={<PlusOutlined />} onClick={openBorrowModal}>
                    登记借出
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>

          <Table
            rowKey="id"
            columns={recordColumns}
            dataSource={borrowRecords}
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </TabPane>

        <TabPane tab="借穿对象" key="objects">
          <Card size="small" style={{ marginBottom: 16 }}>
            <div style={{ textAlign: 'right' }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openObjectModal()}>
                添加对象
              </Button>
            </div>
          </Card>

          <Table
            rowKey="id"
            columns={objectColumns}
            dataSource={borrowObjects}
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </TabPane>

        <TabPane tab="统计分析" key="stats">
          <div style={{ padding: '24px 0' }}>
            {stats && (
              <>
                <h3 className="section-title"><CalendarOutlined /> 近30天借穿分析</h3>
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                  <Col xs={12} sm={6}>
                    <Card className="stat-card">
                      <div className="stat-value">{recent30?.borrowed_count || 0}</div>
                      <div className="stat-label">借出件数</div>
                    </Card>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Card className="stat-card">
                      <div style={{ marginBottom: 8 }}>
                        <Progress
                          type="dashboard"
                          percent={recent30?.on_time_return_rate || 0}
                          strokeColor="#52c41a"
                          size={60}
                        />
                      </div>
                      <div className="stat-label">按时归还率</div>
                    </Card>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Card className="stat-card">
                      <div className="stat-value" style={{ color: '#ff4d4f' }}>
                        {recent30?.overdue_count || 0}
                      </div>
                      <div className="stat-label">逾期未还</div>
                    </Card>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Card className="stat-card">
                      <div className="stat-value" style={{ color: '#fa8c16' }}>
                        {recent30?.condition_decline_count || 0}
                      </div>
                      <div className="stat-label">成色下降</div>
                    </Card>
                  </Col>
                </Row>

                <h3 className="section-title"><UserOutlined /> 最常借出品类</h3>
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                  {stats.most_borrowed_categories.length > 0 ? (
                    stats.most_borrowed_categories.map((cat, idx) => (
                      <Col xs={12} sm={8} md={4} key={idx}>
                        <Card size="small" className="stat-card">
                          <div className="stat-value">{cat.count}</div>
                          <div className="stat-label">{cat.category}</div>
                        </Card>
                      </Col>
                    ))
                  ) : (
                    <Col span={24}>
                      <Empty description="暂无借穿数据" />
                    </Col>
                  )}
                </Row>

                {stats.most_active_borrowers && stats.most_active_borrowers.length > 0 && (
                  <>
                    <h3 className="section-title"><UserOutlined /> 最活跃借穿对象</h3>
                    <Card size="small" style={{ marginBottom: 24 }}>
                      <List
                        dataSource={stats.most_active_borrowers}
                        renderItem={(item, idx) => (
                          <List.Item>
                            <List.Item.Meta
                              avatar={<div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1890ff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{idx + 1}</div>}
                              title={item.name}
                              description={`共借出 ${item.count} 次`}
                            />
                          </List.Item>
                        )}
                      />
                    </Card>
                  </>
                )}

                {stats.overall && (
                  <>
                    <h3 className="section-title"><BarChartOutlined /> 总体概览</h3>
                    <Row gutter={[16, 16]}>
                      <Col xs={12} sm={8}>
                        <Card className="stat-card">
                          <div className="stat-value">{stats.overall.total_borrow_count}</div>
                          <div className="stat-label">累计借出次数</div>
                        </Card>
                      </Col>
                      <Col xs={12} sm={8}>
                        <Card className="stat-card">
                          <div className="stat-value">{stats.overall.total_returned}</div>
                          <div className="stat-label">累计归还次数</div>
                        </Card>
                      </Col>
                      <Col xs={12} sm={8}>
                        <Card className="stat-card">
                          <div className="stat-value">¥{stats.overall.total_borrowed_value.toFixed(0)}</div>
                          <div className="stat-label">累计流转价值</div>
                        </Card>
                      </Col>
                    </Row>
                  </>
                )}
              </>
            )}
          </div>
        </TabPane>
      </Tabs>

      {/* 借出登记弹窗 */}
      <Modal
        title="登记借出"
        open={borrowModalOpen}
        onCancel={() => setBorrowModalOpen(false)}
        footer={null}
        width={700}
      >
        <Form form={borrowForm} layout="vertical" onFinish={handleBorrowSubmit}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="item"
                label="借出物品"
                rules={[{ required: true, message: '请选择借出物品' }]}
              >
                <Select placeholder="请选择可借出的衣物">
                  {availableItems.map(item => (
                    <Option key={item.id} value={item.id}>
                      {item.name} ({item.size_label}) - {item.category_display}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="borrower"
                label="借穿对象"
                rules={[{ required: true, message: '请选择借穿对象' }]}
              >
                <Select
                  placeholder="选择借穿对象"
                  dropdownRender={(menu) => (
                    <>
                      {menu}
                      <Divider style={{ margin: '8px 0' }} />
                      <div style={{ padding: '8px', cursor: 'pointer' }} onClick={() => {
                        setBorrowModalOpen(false)
                        openObjectModal()
                      }}>
                        <PlusOutlined /> 新增借穿对象
                      </div>
                    </>
                  )}
                >
                  {borrowObjects.map(obj => (
                    <Option key={obj.id} value={obj.id}>
                      {obj.name} {obj.baby_name ? `(${obj.baby_name})` : ''}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="borrow_date"
                label="借出时间"
                rules={[{ required: true, message: '请选择借出时间' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="expected_return_date" label="预计归还时间">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="wash_status"
                label="清洗状态"
                rules={[{ required: true, message: '请选择清洗状态' }]}
              >
                <Select options={washStatusOptions} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="note" label="备注">
            <TextArea rows={3} placeholder="填写备注信息..." />
          </Form.Item>
          <Form.Item>
            <Space style={{ float: 'right' }}>
              <Button onClick={() => setBorrowModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认借出</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 借穿对象弹窗 */}
      <Modal
        title={editingObject ? '编辑借穿对象' : '添加借穿对象'}
        open={objectModalOpen}
        onCancel={() => setObjectModalOpen(false)}
        footer={null}
        width={600}
      >
        <Form form={objectForm} layout="vertical" onFinish={handleObjectSubmit}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="name"
                label="借穿人姓名"
                rules={[{ required: true, message: '请输入借穿人姓名' }]}
              >
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="relation" label="与您关系">
                <Select options={relationOptions} placeholder="请选择" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="baby_name" label="对方宝宝姓名">
                <Input placeholder="请输入宝宝姓名" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="baby_gender" label="宝宝性别">
                <Select options={[
                  { value: 'M', label: '男宝' },
                  { value: 'F', label: '女宝' },
                  { value: 'U', label: '未知' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="baby_birth_date" label="宝宝出生日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="phone" label="联系方式">
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="address" label="地址">
            <TextArea rows={2} placeholder="请输入地址" />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <TextArea rows={2} placeholder="填写备注信息..." />
          </Form.Item>
          <Form.Item>
            <Space style={{ float: 'right' }}>
              <Button onClick={() => setObjectModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">保存</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 归还确认弹窗 */}
      <Modal
        title="归还确认"
        open={returnModalOpen}
        onCancel={() => setReturnModalOpen(false)}
        footer={null}
        width={700}
      >
        {returningRecord && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <div style={{ color: '#888', fontSize: 12 }}>物品</div>
                  <div style={{ fontWeight: 600 }}>{returningRecord.item_name}</div>
                  <div style={{ color: '#888', fontSize: 12 }}>
                    {returningRecord.item_category} · {returningRecord.item_size_label}
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ color: '#888', fontSize: 12 }}>借穿对象</div>
                  <div style={{ fontWeight: 600 }}>{returningRecord.borrower_name}</div>
                  {returningRecord.baby_name && (
                    <div style={{ color: '#888', fontSize: 12 }}>宝宝：{returningRecord.baby_name}</div>
                  )}
                </Col>
              </Row>
              <Divider style={{ margin: '12px 0' }} />
              <Row gutter={16}>
                <Col span={8}>
                  <div style={{ color: '#888', fontSize: 12 }}>借出时间</div>
                  <div>{returningRecord.borrow_date}</div>
                </Col>
                <Col span={8}>
                  <div style={{ color: '#888', fontSize: 12 }}>借出时长</div>
                  <div>{returningRecord.days_borrowed}天</div>
                </Col>
                <Col span={8}>
                  <div style={{ color: '#888', fontSize: 12 }}>借出时成色</div>
                  <Tag color="blue">{returningRecord.original_condition_display}</Tag>
                </Col>
              </Row>
            </Card>

            <Form form={returnForm} layout="vertical" onFinish={handleReturnSubmit}>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="actual_return_date"
                    label="实际归还时间"
                    rules={[{ required: true, message: '请选择归还时间' }]}
                  >
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="status"
                    label="归还状态"
                    rules={[{ required: true, message: '请选择归还状态' }]}
                  >
                    <Select options={[
                      { value: 'returned', label: '正常归还' },
                      { value: 'returned_damaged', label: '归还有损坏' },
                    ]} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="return_condition"
                    label="归还时成色"
                    rules={[{ required: true, message: '请选择归还成色' }]}
                  >
                    <Select options={conditionOptions} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="condition_change"
                    label="成色变化"
                    rules={[{ required: true, message: '请选择成色变化' }]}
                  >
                    <Select options={conditionChangeOptions} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="wash_status"
                    label="清洗状态"
                    rules={[{ required: true, message: '请选择清洗状态' }]}
                  >
                    <Select
                      options={washStatusOptions}
                      onChange={(v) => {
                        if (v === 'unwashed') {
                          antdApp.message.info('选择"未清洗"后，衣物将自动进入待清洗清单')
                        }
                      }}
                    />
                  </Form.Item>
                  <Form.Item noStyle shouldUpdate={(prev, cur) => prev.wash_status !== cur.wash_status}>
                    {({ getFieldValue }) => {
                      const ws = getFieldValue('wash_status')
                      if (ws === 'unwashed') {
                        return (
                          <Alert
                            type="warning"
                            showIcon
                            message="归还后该衣物将自动进入「待清洗」清单，可在「护理收纳」页面查看处理"
                            style={{ marginTop: -8, marginBottom: 12 }}
                          />
                        )
                      }
                      if (ws === 'washed') {
                        return (
                          <Alert
                            type="success"
                            showIcon
                            message="归还后该衣物将进入「待入柜」状态，请及时收纳"
                            style={{ marginTop: -8, marginBottom: 12 }}
                          />
                        )
                      }
                      return null
                    }}
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="suggest_transfer"
                    label="转送建议"
                    valuePropName="checked"
                  >
                    <Radio.Group>
                      <Radio value={false}>恢复为自留</Radio>
                      <Radio value={true}>建议转送</Radio>
                    </Radio.Group>
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="return_note" label="归还备注">
                <TextArea rows={3} placeholder="填写归还备注..." />
              </Form.Item>
              <Form.Item>
                <Space style={{ float: 'right' }}>
                  <Button onClick={() => setReturnModalOpen(false)}>取消</Button>
                  <Button type="primary" htmlType="submit">确认归还</Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      {/* 详情弹窗 */}
      <Modal
        title="借穿详情"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        width={600}
      >
        {viewingRecord && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="物品">{viewingRecord.item_name}</Descriptions.Item>
            <Descriptions.Item label="借穿对象">
              {viewingRecord.borrower_name}
              {viewingRecord.baby_name && ` (宝宝: ${viewingRecord.baby_name})`}
            </Descriptions.Item>
            <Descriptions.Item label="借出时间">{viewingRecord.borrow_date}</Descriptions.Item>
            <Descriptions.Item label="预计归还">{viewingRecord.expected_return_date || '-'}</Descriptions.Item>
            <Descriptions.Item label="实际归还">{viewingRecord.actual_return_date || '-'}</Descriptions.Item>
            <Descriptions.Item label="借出时长">{viewingRecord.days_borrowed}天</Descriptions.Item>
            <Descriptions.Item label="借出时成色">{viewingRecord.original_condition_display}</Descriptions.Item>
            <Descriptions.Item label="归还时成色">{viewingRecord.return_condition_display || '-'}</Descriptions.Item>
            <Descriptions.Item label="成色变化">{viewingRecord.condition_change_display || '-'}</Descriptions.Item>
            <Descriptions.Item label="清洗状态">{viewingRecord.wash_status_display}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Badge status={borrowStatusColorMap[viewingRecord.status] as any} text={viewingRecord.status_display} />
            </Descriptions.Item>
            {viewingRecord.note && (
              <Descriptions.Item label="备注">{viewingRecord.note}</Descriptions.Item>
            )}
            {viewingRecord.return_note && (
              <Descriptions.Item label="归还备注">{viewingRecord.return_note}</Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </BabySelector>
  )
}
