import { useState, useEffect, useMemo } from 'react'
import BabySelector from '../components/BabySelector'
import { useBaby } from '../App'
import {
  Button, Table, Modal, Form, Input, Select, DatePicker,
  Space, Popconfirm, App as AntdApp, Card, Row, Col, Tag,
  Tabs, Checkbox, Progress, Tooltip, Empty, Divider, List,
  Radio, Alert, message,
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined,
  ReloadOutlined, CalendarOutlined, CheckCircleOutlined,
  GiftOutlined, LeftOutlined, SwapOutlined, ThunderboltOutlined,
  InboxOutlined, ShoppingCartOutlined, UnorderedListOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons'
import {
  api,
  targetSeasonOptions,
  seasonPlanStatusOptions,
  planItemCategoryOptions,
  itemStatusActionOptions,
  categoryOptions,
} from '../api'
import type {
  SeasonPlan,
  SeasonPlanItem,
  PlanItemCategory,
  ItemStatusAction,
} from '../types'
import dayjs from 'dayjs'

const statusColor: Record<string, string> = {
  draft: 'default',
  in_progress: 'blue',
  completed: 'green',
}

const categoryColor: Record<PlanItemCategory, string> = {
  continue_wear: 'green',
  near_unsuitable: 'orange',
  suggest_transfer: 'red',
  next_season_prep: 'purple',
  lent: 'cyan',
}

const categoryIcon: Record<PlanItemCategory, JSX.Element> = {
  continue_wear: <InboxOutlined />,
  near_unsuitable: <ThunderboltOutlined />,
  suggest_transfer: <GiftOutlined />,
  next_season_prep: <ShoppingCartOutlined />,
  lent: <SwapOutlined />,
}

const actionColor: Record<ItemStatusAction, string> = {
  to_give: 'orange',
  reserved: 'purple',
  keep: 'green',
  none: 'default',
}

const seasonEmoji: Record<string, string> = {
  spring: '🌸',
  summer: '☀️',
  autumn: '🍂',
  winter: '❄️',
}

export default function SeasonPlanPage() {
  const { selectedBaby } = useBaby()
  const antdApp = AntdApp.useApp()
  const [plans, setPlans] = useState<SeasonPlan[]>([])
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'list' | 'detail'>('list')
  const [currentPlan, setCurrentPlan] = useState<SeasonPlan | null>(null)
  const [planLoading, setPlanLoading] = useState(false)

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<SeasonPlan | null>(null)
  const [completeModalOpen, setCompleteModalOpen] = useState(false)
  const [completeNote, setCompleteNote] = useState('')
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()

  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([])
  const [activeTab, setActiveTab] = useState<PlanItemCategory>('continue_wear')

  const loadPlans = async () => {
    if (!selectedBaby) return
    setLoading(true)
    try {
      const list = await api.getSeasonPlans({ baby: selectedBaby.id })
      setPlans(list)
    } catch (e) {
      antdApp.message.error('加载计划列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPlans()
  }, [selectedBaby])

  const openCreate = () => {
    if (!selectedBaby) return
    form.resetFields()
    form.setFieldsValue({
      plan_date: dayjs(),
      target_season: getCurrentSeason(),
      status: 'draft',
    })
    setCreateModalOpen(true)
  }

  const getCurrentSeason = (): string => {
    const m = dayjs().month()
    if (m >= 2 && m <= 4) return 'spring'
    if (m >= 5 && m <= 7) return 'summer'
    if (m >= 8 && m <= 10) return 'autumn'
    return 'winter'
  }

  const handleCreate = async (values: any) => {
    try {
      if (!selectedBaby) return
      const data = {
        baby: selectedBaby.id,
        name: values.name,
        target_season: values.target_season,
        plan_date: values.plan_date.format('YYYY-MM-DD'),
        status: values.status,
        note: values.note,
      }
      await api.createSeasonPlan(data)
      antdApp.message.success('创建整理计划成功，系统已自动生成分类清单')
      setCreateModalOpen(false)
      loadPlans()
    } catch (e) {
      antdApp.message.error('创建失败')
    }
  }

  const openEdit = (plan: SeasonPlan) => {
    setEditingPlan(plan)
    editForm.setFieldsValue({
      name: plan.name,
      target_season: plan.target_season,
      plan_date: dayjs(plan.plan_date),
      status: plan.status,
      note: plan.note,
    })
    setEditModalOpen(true)
  }

  const handleEdit = async (values: any) => {
    try {
      if (!editingPlan) return
      const data = {
        name: values.name,
        target_season: values.target_season,
        plan_date: values.plan_date.format('YYYY-MM-DD'),
        status: values.status,
        note: values.note,
      }
      await api.updateSeasonPlan(editingPlan.id, data)
      antdApp.message.success('更新成功')
      setEditModalOpen(false)
      loadPlans()
      if (view === 'detail' && currentPlan?.id === editingPlan.id) {
        loadPlanDetail(editingPlan.id)
      }
    } catch (e) {
      antdApp.message.error('更新失败')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.deleteSeasonPlan(id)
      antdApp.message.success('删除成功')
      loadPlans()
      if (view === 'detail' && currentPlan?.id === id) {
        setView('list')
        setCurrentPlan(null)
      }
    } catch (e) {
      antdApp.message.error('删除失败')
    }
  }

  const loadPlanDetail = async (id: number) => {
    setPlanLoading(true)
    try {
      const plan = await api.getSeasonPlan(id)
      setCurrentPlan(plan)
      setActiveTab('continue_wear')
      setSelectedRowKeys([])
    } catch (e) {
      antdApp.message.error('加载计划详情失败')
    } finally {
      setPlanLoading(false)
    }
  }

  const openDetail = (plan: SeasonPlan) => {
    setView('detail')
    loadPlanDetail(plan.id)
  }

  const backToList = () => {
    setView('list')
    setCurrentPlan(null)
    setSelectedRowKeys([])
  }

  const handleRegenerate = async () => {
    if (!currentPlan) return
    try {
      await api.regenerateSeasonPlanItems(currentPlan.id)
      antdApp.message.success('已重新生成分类清单')
      loadPlanDetail(currentPlan.id)
    } catch (e) {
      antdApp.message.error('重新生成失败')
    }
  }

  const handleBatchAction = async (action: ItemStatusAction) => {
    if (!currentPlan || selectedRowKeys.length === 0) {
      antdApp.message.warning('请先选择要操作的物品')
      return
    }
    const lentItems = (currentPlan.plan_items || []).filter(
      (item) => selectedRowKeys.includes(item.id) && item.effective_category === 'lent'
    )
    if (lentItems.length > 0 && ['to_give', 'reserved'].includes(action)) {
      antdApp.message.warning(`有 ${lentItems.length} 件衣物处于借出中状态，无法执行转送批量操作`)
      return
    }
    try {
      await api.batchActionSeasonPlan(currentPlan.id, selectedRowKeys, action)
      antdApp.message.success(
        `已批量${action === 'none' ? '清除操作标记' : itemStatusActionOptions.find(o => o.value === action)?.label}`
      )
      loadPlanDetail(currentPlan.id)
    } catch (e) {
      antdApp.message.error('操作失败')
    }
  }

  const handleChangeCategory = async (category: PlanItemCategory) => {
    if (!currentPlan || selectedRowKeys.length === 0) {
      antdApp.message.warning('请先选择要调整分类的物品')
      return
    }
    const lentItems = (currentPlan.plan_items || []).filter(
      (item) => selectedRowKeys.includes(item.id) && item.effective_category === 'lent'
    )
    if (lentItems.length > 0) {
      antdApp.message.warning('借出中衣物的分类由借穿状态自动管理，无法手动调整')
      return
    }
    try {
      await api.changeCategorySeasonPlan(currentPlan.id, selectedRowKeys, category)
      antdApp.message.success(`已调整为「${planItemCategoryOptions.find(o => o.value === category)?.label}」`)
      loadPlanDetail(currentPlan.id)
    } catch (e) {
      antdApp.message.error('操作失败')
    }
  }

  const handleCompletePlan = async () => {
    if (!currentPlan) return
    try {
      await api.completeSeasonPlan(currentPlan.id, completeNote)
      antdApp.message.success('计划已标记完成！')
      setCompleteModalOpen(false)
      setCompleteNote('')
      loadPlanDetail(currentPlan.id)
      loadPlans()
    } catch (e) {
      antdApp.message.error('操作失败')
    }
  }

  const planColumns = [
    {
      title: '计划名称',
      dataIndex: 'name',
      render: (v: string, r: SeasonPlan) => (
        <Button type="link" style={{ padding: 0 }} onClick={() => openDetail(r)}>
          <span style={{ fontWeight: 500 }}>{v}</span>
        </Button>
      ),
    },
    {
      title: '目标季节',
      dataIndex: 'target_season_display',
      width: 120,
      render: (v: string, r: SeasonPlan) => (
        <Tag color="blue">
          {seasonEmoji[r.target_season] || ''} {v}
        </Tag>
      ),
    },
    {
      title: '计划日期',
      dataIndex: 'plan_date',
      width: 120,
      render: (v: string) => v,
    },
    {
      title: '完成时间',
      dataIndex: 'completed_date',
      width: 120,
      render: (v: string | null) => v || '-',
    },
    {
      title: '状态',
      dataIndex: 'status_display',
      width: 100,
      render: (v: string, r: SeasonPlan) => (
        <Tag color={statusColor[r.status]}>{v}</Tag>
      ),
    },
    {
      title: '物品总数',
      dataIndex: 'stats',
      width: 100,
      render: (stats: any) => {
        if (!stats) return 0
        return (
          <span style={{ fontWeight: 600 }}>
            {stats.continue_wear + stats.near_unsuitable + stats.suggest_transfer + stats.next_season_prep}
          </span>
        )
      },
    },
    {
      title: '完成率',
      dataIndex: 'stats',
      width: 130,
      render: (stats: any, r: SeasonPlan) => {
        if (!stats) return <Progress percent={0} size="small" />
        const total = stats.continue_wear + stats.near_unsuitable + stats.suggest_transfer + stats.next_season_prep
        const processed = stats.action_to_give + stats.action_reserved + stats.action_keep
        const percent = r.status === 'completed' ? 100 : total > 0 ? Math.round((processed / total) * 100) : 0
        return <Progress percent={percent} size="small" />
      },
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, r: SeasonPlan) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetail(r)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>
            编辑
          </Button>
          <Popconfirm title="确定删除此计划？" onConfirm={() => handleDelete(r.id)} okText="删除" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const itemsByCategory = useMemo(() => {
    const items = currentPlan?.plan_items || []
    const result: Record<PlanItemCategory, SeasonPlanItem[]> = {
      continue_wear: [],
      near_unsuitable: [],
      suggest_transfer: [],
      next_season_prep: [],
      lent: [],
    }
    items.forEach((item) => {
      result[item.effective_category].push(item)
    })
    return result
  }, [currentPlan])

  const currentItems = itemsByCategory[activeTab] || []
  const stats = currentPlan?.stats

  const itemColumns = [
    {
      title: '物品名称',
      dataIndex: 'item_name',
      render: (v: string, r: SeasonPlanItem) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <div style={{ fontWeight: 500 }}>{v}</div>
            {r.effective_category === 'lent' && (
              <Tag color="cyan" style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>暂不可整理</Tag>
            )}
          </div>
          <div style={{ color: '#888', fontSize: 12 }}>
            {r.item_size_label} · {categoryOptions.find(c => c.value === r.item_category)?.label || r.item_category}
          </div>
          {r.effective_category === 'lent' && r.item_current_borrow && (
            <div style={{ marginTop: 4, fontSize: 11, color: '#fa8c16' }}>
              👤 借予 {r.item_current_borrow.borrower_name}
              {r.item_current_borrow.expected_return_date && ` · 预计 ${r.item_current_borrow.expected_return_date} 归还`}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '季节',
      dataIndex: 'item_season',
      width: 80,
      render: (v: string) => {
        const seasonMap: Record<string, string> = {
          spring: '🌸春', summer: '☀️夏', autumn: '🍂秋', winter: '❄️冬', all: '🔄四季'
        }
        return seasonMap[v] || v
      },
    },
    {
      title: '成色',
      dataIndex: 'item_condition',
      width: 80,
      render: (v: string) => {
        const condMap: Record<string, string> = {
          new: '全新', like_new: '9成新', good: '8成新', fair: '7成新', worn: '有痕迹'
        }
        return condMap[v] || v
      },
    },
    {
      title: '系统分类',
      dataIndex: 'auto_category_display',
      width: 130,
      render: (v: string, r: SeasonPlanItem) => (
        <Tag color={categoryColor[r.auto_category]}>
          {categoryIcon[r.auto_category]} {v}
        </Tag>
      ),
    },
    {
      title: '用户调整',
      dataIndex: 'user_category',
      width: 130,
      render: (_: any, r: SeasonPlanItem) => (
        r.user_category ? (
          <Tag color="geekblue">
            <SwapOutlined /> {r.effective_category_display}
          </Tag>
        ) : (
          <Tag color="default">--</Tag>
        )
      ),
    },
    {
      title: '操作标记',
      dataIndex: 'item_status_action_display',
      width: 110,
      render: (v: string, r: SeasonPlanItem) => (
        <Tag color={actionColor[r.item_status_action]}>
          {v}
        </Tag>
      ),
    },
  ]

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys as number[]),
  }

  const tabItems = [
    {
      key: 'continue_wear',
      label: (
        <span>
          <InboxOutlined /> 本季可继续穿
          <Tag style={{ marginLeft: 8 }} color="green">{itemsByCategory.continue_wear.length}</Tag>
        </span>
      ),
    },
    {
      key: 'near_unsuitable',
      label: (
        <span>
          <ThunderboltOutlined /> 即将不合身
          <Tag style={{ marginLeft: 8 }} color="orange">{itemsByCategory.near_unsuitable.length}</Tag>
        </span>
      ),
    },
    {
      key: 'suggest_transfer',
      label: (
        <span>
          <GiftOutlined /> 建议转送
          <Tag style={{ marginLeft: 8 }} color="red">{itemsByCategory.suggest_transfer.length}</Tag>
        </span>
      ),
    },
    {
      key: 'next_season_prep',
      label: (
        <span>
          <ShoppingCartOutlined /> 下一季待准备
          <Tag style={{ marginLeft: 8 }} color="purple">{itemsByCategory.next_season_prep.length}</Tag>
        </span>
      ),
    },
    {
      key: 'lent',
      label: (
        <span>
          <SwapOutlined /> 借出中（暂不可整理）
          <Tag style={{ marginLeft: 8 }} color="cyan">{itemsByCategory.lent.length}</Tag>
        </span>
      ),
    },
  ]

  if (!selectedBaby) {
    return (
      <BabySelector title="换季整理计划" description="按目标季节自动分类衣物，生成「本季可穿/即将不合身/建议转送/下季待准备」四类清单，支持批量标记和整理完成确认。">
        <Empty description="请先选择宝宝" />
      </BabySelector>
    )
  }

  return (
    <BabySelector
      title="换季整理计划"
      description="串起物品档案、成长适配、转送记录和统计数据，按目标季节自动分类生成整理清单，支持批量操作、分类调整和计划完成确认。"
    >
      {view === 'list' && (
        <>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 className="section-title"><UnorderedListOutlined /> 整理计划列表</h3>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              新建整理计划
            </Button>
          </div>

          <Table
            rowKey="id"
            loading={loading}
            columns={planColumns}
            dataSource={plans}
            scroll={{ x: 1100 }}
            pagination={{ pageSize: 10 }}
          />

          <Modal
            title="新建换季整理计划"
            open={createModalOpen}
            onCancel={() => setCreateModalOpen(false)}
            onOk={() => form.submit()}
            width={560}
            okText="创建"
            cancelText="取消"
            destroyOnHidden
          >
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              message="创建后系统将自动根据宝宝的成长数据和衣物信息，生成四类分类清单。"
            />
            <Form form={form} layout="vertical" onFinish={handleCreate}>
              <Form.Item name="name" label="计划名称" rules={[{ required: true, message: '请输入计划名称' }]}>
                <Input placeholder="如：2026夏季整理、宝宝入园换季" />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="target_season" label="目标季节" rules={[{ required: true }]}>
                    <Select
                      options={targetSeasonOptions.map(o => ({
                        value: o.value,
                        label: `${seasonEmoji[o.value] || ''} ${o.label}`,
                      }))}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="plan_date" label="计划日期" rules={[{ required: true }]}>
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="status" label="初始状态" rules={[{ required: true }]}>
                <Radio.Group>
                  <Radio.Button value="draft">草稿</Radio.Button>
                  <Radio.Button value="in_progress">进行中</Radio.Button>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="note" label="整理备注">
                <Input.TextArea rows={3} placeholder="如：整理目标、优先转送名单等" />
              </Form.Item>
            </Form>
          </Modal>

          <Modal
            title="编辑整理计划"
            open={editModalOpen}
            onCancel={() => setEditModalOpen(false)}
            onOk={() => editForm.submit()}
            width={560}
            okText="保存"
            cancelText="取消"
            destroyOnHidden
          >
            <Form form={editForm} layout="vertical" onFinish={handleEdit}>
              <Form.Item name="name" label="计划名称" rules={[{ required: true, message: '请输入计划名称' }]}>
                <Input placeholder="请输入计划名称" />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="target_season" label="目标季节" rules={[{ required: true }]}>
                    <Select
                      options={targetSeasonOptions.map(o => ({
                        value: o.value,
                        label: `${seasonEmoji[o.value] || ''} ${o.label}`,
                      }))}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="plan_date" label="计划日期" rules={[{ required: true }]}>
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="status" label="状态" rules={[{ required: true }]}>
                <Radio.Group>
                  {seasonPlanStatusOptions.map(o => (
                    <Radio.Button key={o.value} value={o.value}>{o.label}</Radio.Button>
                  ))}
                </Radio.Group>
              </Form.Item>
              <Form.Item name="note" label="整理备注">
                <Input.TextArea rows={3} />
              </Form.Item>
            </Form>
          </Modal>
        </>
      )}

      {view === 'detail' && currentPlan && (
        <div style={{ padding: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <Button icon={<ArrowLeftOutlined />} onClick={backToList}>返回列表</Button>
            <Divider type="vertical" style={{ height: 28 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: 20 }}>{currentPlan.name}</h2>
                <Tag color="blue" style={{ fontSize: 14, padding: '2px 10px' }}>
                  {seasonEmoji[currentPlan.target_season] || ''} {currentPlan.target_season_display}
                </Tag>
                <Tag color={statusColor[currentPlan.status]} style={{ fontSize: 14, padding: '2px 10px' }}>
                  {currentPlan.status_display}
                </Tag>
              </div>
              <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>
                <CalendarOutlined /> 计划日期：{currentPlan.plan_date}
                {currentPlan.completed_date && (
                  <span style={{ marginLeft: 16 }}>
                    <CheckCircleOutlined style={{ color: '#52c41a' }} /> 完成时间：{currentPlan.completed_date}
                  </span>
                )}
              </div>
            </div>
          </div>

          {stats && (
            <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
              <Col xs={12} sm={6}>
                <Card size="small" className="stat-card">
                  <div style={{ color: '#888', fontSize: 12 }}>本季可继续穿</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#52c41a' }}>{stats.continue_wear}</div>
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card size="small" className="stat-card">
                  <div style={{ color: '#888', fontSize: 12 }}>即将不合身</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#fa8c16' }}>{stats.near_unsuitable}</div>
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card size="small" className="stat-card">
                  <div style={{ color: '#888', fontSize: 12 }}>建议转送</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#ff4d4f' }}>{stats.suggest_transfer}</div>
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card size="small" className="stat-card">
                  <div style={{ color: '#888', fontSize: 12 }}>借出中</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#13c2c2' }}>{stats.lent || 0}</div>
                </Card>
              </Col>
            </Row>
          )}

          {stats && (
            <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
              <Col xs={24} sm={12}>
                <Card size="small" title="整理进度">
                  <Progress
                    percent={currentPlan.status === 'completed' ? 100 : (() => {
                      const total = stats.continue_wear + stats.near_unsuitable + stats.suggest_transfer + stats.next_season_prep
                      const processed = stats.action_to_give + stats.action_reserved + stats.action_keep
                      return total > 0 ? Math.round((processed / total) * 100) : 0
                    })()}
                    status={currentPlan.status === 'completed' ? 'success' : 'active'}
                  />
                  {(stats.lent || 0) > 0 && (
                    <div style={{ marginTop: 4, color: '#13c2c2', fontSize: 12 }}>
                      💡 另有 {stats.lent} 件借出中衣物暂不纳入整理
                    </div>
                  )}
                  <div style={{ marginTop: 8, color: '#666', fontSize: 13, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span>📌 已标记待转送：{stats.action_to_give} 件</span>
                    <span>✅ 已预定：{stats.action_reserved} 件</span>
                    <span>💚 确认自留：{stats.action_keep} 件</span>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12}>
                <Card size="small" title="整理备注">
                  <div style={{ color: '#666', fontSize: 13, minHeight: 40 }}>
                    {currentPlan.note || <span style={{ color: '#bbb' }}>暂无备注</span>}
                  </div>
                </Card>
              </Col>
            </Row>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
            <Space wrap size="small">
              <Tooltip title="根据最新成长数据重新生成分类">
                <Button icon={<ReloadOutlined />} onClick={handleRegenerate} disabled={currentPlan.status === 'completed'}>
                  重新生成清单
                </Button>
              </Tooltip>
              <Button icon={<EditOutlined />} onClick={() => openEdit(currentPlan)}>编辑计划</Button>
            </Space>
            <Space wrap size="small">
              {selectedRowKeys.length > 0 && (
                <Tag color="blue">已选 {selectedRowKeys.length} 项</Tag>
              )}
              <DropdownMenu
                label="调整分类"
                icon={<SwapOutlined />}
                options={planItemCategoryOptions}
                onSelect={(val) => handleChangeCategory(val as PlanItemCategory)}
                disabled={currentPlan.status === 'completed' || selectedRowKeys.length === 0}
              />
              <DropdownMenu
                label="批量操作"
                icon={<CheckCircleOutlined />}
                options={itemStatusActionOptions}
                onSelect={(val) => handleBatchAction(val as ItemStatusAction)}
                disabled={currentPlan.status === 'completed' || selectedRowKeys.length === 0}
              />
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => {
                  setCompleteNote(currentPlan.note || '')
                  setCompleteModalOpen(true)
                }}
                disabled={currentPlan.status === 'completed'}
              >
                标记完成
              </Button>
            </Space>
          </div>

          <Tabs
            activeKey={activeTab}
            onChange={(key) => {
              setActiveTab(key as PlanItemCategory)
              setSelectedRowKeys([])
            }}
            items={tabItems}
            destroyInactiveTabPane
          />

          <Table
            rowKey="id"
            loading={planLoading}
            columns={itemColumns}
            dataSource={currentItems}
            rowSelection={currentPlan.status === 'completed' ? undefined : rowSelection}
            scroll={{ x: 900 }}
            pagination={{ pageSize: 10 }}
            locale={{
              emptyText: (
                <Empty
                  description={
                    <span>
                      {categoryIcon[activeTab]} 此分类暂无物品
                    </span>
                  }
                />
              ),
            }}
          />

          <Modal
            title={
              <span>
                <CheckCircleOutlined style={{ color: '#52c41a' }} /> 确认完成整理计划
              </span>
            }
            open={completeModalOpen}
            onCancel={() => setCompleteModalOpen(false)}
            onOk={handleCompletePlan}
            okText="确认完成"
            okButtonProps={{ type: 'primary' }}
            cancelText="继续整理"
            width={500}
          >
            <Alert
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
              message="确认后，计划状态将变为「已完成」，并记录完成时间。"
            />
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 6, color: '#666', fontSize: 13 }}>整理总结备注</label>
              <Input.TextArea
                rows={3}
                value={completeNote}
                onChange={(e) => setCompleteNote(e.target.value)}
                placeholder="如：已将12件衣物转送，6件预定给同事，留8件下一季..."
              />
            </div>
          </Modal>
        </div>
      )}
    </BabySelector>
  )
}

function DropdownMenu(props: {
  label: string
  icon?: React.ReactNode
  options: Array<{ value: string; label: string }>
  onSelect: (val: string) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ display: 'inline-block', position: 'relative' }}>
      <Button
        icon={props.icon}
        disabled={props.disabled}
        onClick={() => !props.disabled && setOpen(!open)}
      >
        {props.label}
      </Button>
      {open && !props.disabled && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 998,
            }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 4,
              background: '#fff',
              border: '1px solid #f0f0f0',
              borderRadius: 6,
              boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
              minWidth: 140,
              zIndex: 999,
              padding: 4,
            }}
          >
            {props.options.map(o => (
              <div
                key={o.value}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  borderRadius: 4,
                  fontSize: 13,
                }}
                onClick={() => {
                  props.onSelect(o.value)
                  setOpen(false)
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {o.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
