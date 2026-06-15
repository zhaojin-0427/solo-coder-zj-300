import { useState, useEffect, useMemo } from 'react'
import BabySelector from '../components/BabySelector'
import { useBaby } from '../App'
import {
  Button, Table, Modal, Form, Input, Select, DatePicker,
  Space, Popconfirm, App as AntdApp, Card, Row, Col, Tag,
  Tabs, Checkbox, Progress, Tooltip, Empty, Divider, List,
  Radio, Alert, message, InputNumber,
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined,
  ReloadOutlined, CalendarOutlined, CheckCircleOutlined,
  GiftOutlined, LeftOutlined, SwapOutlined, ThunderboltOutlined,
  InboxOutlined, ShoppingCartOutlined, UnorderedListOutlined,
  ArrowLeftOutlined, CarryOutOutlined, SettingOutlined,
  ExclamationCircleOutlined, BulbOutlined, HistoryOutlined,
  ShoppingOutlined, SafetyOutlined,
} from '@ant-design/icons'
import {
  api,
  outfitSceneOptions,
  itemTypeOptions,
  packingStatusOptions,
  packingTaskStatusOptions,
  packingStatusTagColors,
  packingTaskStatusColors,
  itemTypeTagColors,
  seasonOptions,
  categoryOptions,
  careStatusTagColors,
} from '../api'
import type {
  OutfitSet,
  OutfitSetItem,
  PackingTask,
  PackingCheckRecord,
  PackingStatus,
  ClothingItem,
} from '../types'
import dayjs from 'dayjs'

type PageView = 'sets' | 'set-detail' | 'packing-list' | 'packing-detail'

export default function TravelPackPage() {
  const { selectedBaby } = useBaby()
  const antdApp = AntdApp.useApp()

  const [view, setView] = useState<PageView>('sets')
  const [sets, setSets] = useState<OutfitSet[]>([])
  const [packingTasks, setPackingTasks] = useState<PackingTask[]>([])
  const [loading, setLoading] = useState(false)

  const [currentSet, setCurrentSet] = useState<OutfitSet | null>(null)
  const [currentTask, setCurrentTask] = useState<PackingTask | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [setModalOpen, setSetModalOpen] = useState(false)
  const [editingSet, setEditingSet] = useState<OutfitSet | null>(null)
  const [setForm] = Form.useForm()

  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [editingSetItem, setEditingSetItem] = useState<OutfitSetItem | null>(null)
  const [availableItems, setAvailableItems] = useState<ClothingItem[]>([])
  const [itemForm] = Form.useForm()

  const [packingModalOpen, setPackingModalOpen] = useState(false)
  const [packingForm] = Form.useForm()

  const [filterScene, setFilterScene] = useState<string>('')
  const [filterSeason, setFilterSeason] = useState<string>('')

  const [activeTab, setActiveTab] = useState<'sets' | 'history'>('sets')

  const loadSets = async () => {
    if (!selectedBaby) return
    setLoading(true)
    try {
      const params: Record<string, any> = { baby: selectedBaby.id }
      if (filterScene) params.scene = filterScene
      if (filterSeason) params.season = filterSeason
      const list = await api.getOutfitSets(params)
      setSets(list)
    } catch (e) {
      antdApp.message.error('加载套装列表失败')
    } finally {
      setLoading(false)
    }
  }

  const loadPackingTasks = async () => {
    if (!selectedBaby) return
    try {
      const list = await api.getPackingTasks({ baby: selectedBaby.id })
      setPackingTasks(list)
    } catch (e) {
      antdApp.message.error('加载打包记录失败')
    }
  }

  useEffect(() => {
    loadSets()
    loadPackingTasks()
  }, [selectedBaby, filterScene, filterSeason])

  const loadSetDetail = async (id: number) => {
    setDetailLoading(true)
    try {
      const set = await api.getOutfitSet(id)
      setCurrentSet(set)
    } catch (e) {
      antdApp.message.error('加载套装详情失败')
    } finally {
      setDetailLoading(false)
    }
  }

  const loadTaskDetail = async (id: number) => {
    setDetailLoading(true)
    try {
      const task = await api.getPackingTask(id)
      setCurrentTask(task)
    } catch (e) {
      antdApp.message.error('加载打包详情失败')
    } finally {
      setDetailLoading(false)
    }
  }

  const openCreateSet = () => {
    if (!selectedBaby) return
    setEditingSet(null)
    setForm.resetFields()
    setForm.setFieldsValue({
      scene: 'daily_outing',
      season: 'all',
      backup_count: 1,
    })
    setSetModalOpen(true)
  }

  const openEditSet = (set: OutfitSet) => {
    setEditingSet(set)
    setForm.setFieldsValue({
      name: set.name,
      scene: set.scene,
      season: set.season,
      min_temperature: set.min_temperature,
      max_temperature: set.max_temperature,
      backup_count: set.backup_count,
      note: set.note,
    })
    setSetModalOpen(true)
  }

  const handleSaveSet = async (values: any) => {
    try {
      if (!selectedBaby) return
      const data = {
        baby: selectedBaby.id,
        name: values.name,
        scene: values.scene,
        season: values.season,
        min_temperature: values.min_temperature,
        max_temperature: values.max_temperature,
        backup_count: values.backup_count,
        note: values.note || '',
      }
      if (editingSet) {
        await api.updateOutfitSet(editingSet.id, data)
        antdApp.message.success('更新成功')
        loadSetDetail(editingSet.id)
      } else {
        const newSet = await api.createOutfitSet(data)
        antdApp.message.success('创建成功')
        setCurrentSet(newSet)
        setView('set-detail')
      }
      setSetModalOpen(false)
      loadSets()
    } catch (e) {
      antdApp.message.error('保存失败')
    }
  }

  const handleDeleteSet = async (id: number) => {
    try {
      await api.deleteOutfitSet(id)
      antdApp.message.success('删除成功')
      loadSets()
      if (view === 'set-detail' && currentSet?.id === id) {
        setView('sets')
        setCurrentSet(null)
      }
    } catch (e) {
      antdApp.message.error('删除失败')
    }
  }

  const openAddItem = async () => {
    if (!selectedBaby || !currentSet) return
    setEditingSetItem(null)
    itemForm.resetFields()
    itemForm.setFieldsValue({
      item_type: 'must',
      quantity: 1,
    })
    try {
      const res = await api.getOutfitSetAvailableItems(selectedBaby.id)
      const existingItemIds = currentSet.set_items?.map(i => i.item) || []
      const filtered = res.items.filter(item => !existingItemIds.includes(item.id))
      setAvailableItems(filtered)
    } catch (e) {
      antdApp.message.error('加载可用衣物失败')
    }
    setItemModalOpen(true)
  }

  const openEditItem = (item: OutfitSetItem) => {
    setEditingSetItem(item)
    itemForm.setFieldsValue({
      item: item.item,
      item_type: item.item_type,
      quantity: item.quantity,
      note: item.note,
    })
    setAvailableItems([])
    setItemModalOpen(true)
  }

  const handleSaveItem = async (values: any) => {
    if (!currentSet) return
    try {
      const existingItems = currentSet.set_items || []
      let newItems: any[] = []

      if (editingSetItem) {
        newItems = existingItems.map(item =>
          item.id === editingSetItem.id
            ? {
                id: item.id,
                item: values.item,
                item_type: values.item_type,
                quantity: values.quantity,
                note: values.note || '',
                sort_order: item.sort_order,
              }
            : {
                id: item.id,
                item: item.item,
                item_type: item.item_type,
                quantity: item.quantity,
                note: item.note || '',
                sort_order: item.sort_order,
              }
        )
      } else {
        newItems = [
          ...existingItems.map(item => ({
            id: item.id,
            item: item.item,
            item_type: item.item_type,
            quantity: item.quantity,
            note: item.note || '',
            sort_order: item.sort_order,
          })),
          {
            item: values.item,
            item_type: values.item_type,
            quantity: values.quantity,
            note: values.note || '',
            sort_order: existingItems.length,
          },
        ]
      }

      await api.updateOutfitSet(currentSet.id, { items: newItems })
      antdApp.message.success('保存成功')
      setItemModalOpen(false)
      loadSetDetail(currentSet.id)
    } catch (e) {
      antdApp.message.error('保存失败')
    }
  }

  const handleDeleteItem = async (itemId: number) => {
    if (!currentSet) return
    try {
      const existingItems = currentSet.set_items || []
      const newItems = existingItems
        .filter(item => item.id !== itemId)
        .map((item, idx) => ({
          id: item.id,
          item: item.item,
          item_type: item.item_type,
          quantity: item.quantity,
          note: item.note || '',
          sort_order: idx,
        }))

      await api.updateOutfitSet(currentSet.id, { items: newItems })
      antdApp.message.success('删除成功')
      loadSetDetail(currentSet.id)
    } catch (e) {
      antdApp.message.error('删除失败')
    }
  }

  const openCreatePacking = (set: OutfitSet) => {
    if (!selectedBaby) return
    packingForm.resetFields()
    packingForm.setFieldsValue({
      name: `${set.name} - 出行打包`,
      set_id: set.id,
      scene: set.scene,
      trip_date: dayjs(),
    })
    setPackingModalOpen(true)
  }

  const handleCreatePacking = async (values: any) => {
    try {
      if (!selectedBaby) return
      const data = {
        baby: selectedBaby.id,
        name: values.name,
        scene: values.scene,
        trip_date: values.trip_date?.format('YYYY-MM-DD'),
        note: values.note || '',
        set_id: values.set_id,
      }
      const task = await api.createPackingTask(data)
      antdApp.message.success('打包任务创建成功')
      setPackingModalOpen(false)
      setCurrentTask(task)
      setView('packing-detail')
      loadPackingTasks()
    } catch (e) {
      antdApp.message.error('创建失败')
    }
  }

  const handleMarkPacked = async (item: PackingCheckRecord) => {
    if (!currentTask) return
    try {
      await api.updatePackingItem(currentTask.id, item.id, { pack_status: 'packed' })
      antdApp.message.success('已标记为已打包')
      loadTaskDetail(currentTask.id)
    } catch (e) {
      antdApp.message.error('操作失败')
    }
  }

  const handleMarkMissing = async (item: PackingCheckRecord) => {
    if (!currentTask) return
    try {
      await api.updatePackingItem(currentTask.id, item.id, { pack_status: 'missing' })
      antdApp.message.success('已标记为缺失')
      loadTaskDetail(currentTask.id)
    } catch (e) {
      antdApp.message.error('操作失败')
    }
  }

  const handleReplaceItem = async (item: PackingCheckRecord, replaceItemId: number) => {
    if (!currentTask) return
    try {
      await api.updatePackingItem(currentTask.id, item.id, {
        pack_status: 'replaced',
        replaced_item_id: replaceItemId,
      })
      antdApp.message.success('替换成功')
      loadTaskDetail(currentTask.id)
    } catch (e) {
      antdApp.message.error('替换失败')
    }
  }

  const handleCompletePacking = async () => {
    if (!currentTask) return
    try {
      await api.completePackingTask(currentTask.id)
      antdApp.message.success('打包完成！')
      loadTaskDetail(currentTask.id)
      loadPackingTasks()
    } catch (e) {
      antdApp.message.error('操作失败')
    }
  }

  const goBack = () => {
    if (view === 'set-detail') {
      setView('sets')
      setCurrentSet(null)
    } else if (view === 'packing-detail') {
      setView('packing-list')
      setCurrentTask(null)
    }
  }

  const setColumns = [
    {
      title: '套装名称',
      dataIndex: 'name',
      render: (v: string, r: OutfitSet) => (
        <Button type="link" style={{ padding: 0 }} onClick={() => { setCurrentSet(r); setView('set-detail'); loadSetDetail(r.id) }}>
          <span style={{ fontWeight: 500 }}>{v}</span>
        </Button>
      ),
    },
    {
      title: '适用场景',
      dataIndex: 'scene_display',
      width: 120,
      render: (_: any, r: OutfitSet) => {
        const scene = outfitSceneOptions.find(s => s.value === r.scene)
        return <Tag>{scene?.emoji} {scene?.label || r.scene}</Tag>
      },
    },
    {
      title: '适用季节',
      dataIndex: 'season_display',
      width: 100,
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: '温度范围',
      width: 100,
      render: (_: any, r: OutfitSet) => {
        if (r.min_temperature != null && r.max_temperature != null) {
          return `${r.min_temperature}~${r.max_temperature}℃`
        }
        if (r.min_temperature != null) {
          return `≥${r.min_temperature}℃`
        }
        if (r.max_temperature != null) {
          return `≤${r.max_temperature}℃`
        }
        return '-'
      },
    },
    {
      title: '物品数',
      dataIndex: 'item_count',
      width: 80,
      render: (v: number) => <span style={{ fontWeight: 600 }}>{v || 0}</span>,
    },
    {
      title: '可用/不可用',
      width: 110,
      render: (_: any, r: OutfitSet) => (
        <div>
          <Tag color="green">{r.available_count || 0}可用</Tag>
          {(r.unavailable_count || 0) > 0 && (
            <Tag color="red">{r.unavailable_count}不可用</Tag>
          )}
        </div>
      ),
    },
    {
      title: '使用次数',
      dataIndex: 'use_count',
      width: 80,
    },
    {
      title: '最近使用',
      dataIndex: 'last_used_at',
      width: 120,
      render: (v: string | null) => v ? dayjs(v).format('YYYY-MM-DD') : '-',
    },
    {
      title: '操作',
      width: 220,
      fixed: 'right' as const,
      render: (_: any, r: OutfitSet) => (
        <Space size="small">
          <Button type="link" size="small" icon={<CarryOutOutlined />} onClick={() => openCreatePacking(r)}>
            生成清单
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditSet(r)}>
            编辑
          </Button>
          <Popconfirm title="确定删除此套装？" onConfirm={() => handleDeleteSet(r.id)} okText="删除" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const setItemColumns = [
    {
      title: '物品名称',
      dataIndex: 'item_info',
      render: (_: any, r: OutfitSetItem) => {
        const item = r.item_info
        return (
          <div>
            <div style={{ fontWeight: 500 }}>{item?.name || '未知物品'}</div>
            <div style={{ color: '#888', fontSize: 12 }}>
              {item?.size_label} · {categoryOptions.find(c => c.value === item?.category)?.label || item?.category}
            </div>
            {!r.is_available && (
              <Tag color="red" style={{ marginTop: 4, fontSize: 11 }}>
                暂不可打包 - {r.unavailable_reason}
              </Tag>
            )}
          </div>
        )
      },
    },
    {
      title: '类型',
      dataIndex: 'item_type',
      width: 80,
      render: (v: string) => <Tag color={itemTypeTagColors[v]}>{itemTypeOptions.find(o => o.value === v)?.label}</Tag>,
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      width: 70,
    },
    {
      title: '护理状态',
      width: 100,
      render: (_: any, r: OutfitSetItem) => {
        const item = r.item_info
        if (!item) return '-'
        return (
          <Tag color={careStatusTagColors[item.care_status] || 'default'}>
            {item.care_status_display}
          </Tag>
        )
      },
    },
    {
      title: '收纳位置',
      width: 120,
      render: (_: any, r: OutfitSetItem) => {
        const loc = r.item_info?.storage_location_info
        return loc ? loc.name : '-'
      },
    },
    {
      title: '备注',
      dataIndex: 'note',
      width: 150,
      render: (v: string) => v || '-',
    },
    {
      title: '操作',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, r: OutfitSetItem) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditItem(r)}>编辑</Button>
          <Popconfirm title="确定移除此衣物？" onConfirm={() => handleDeleteItem(r.id)} okText="移除" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>移除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const packingTaskColumns = [
    {
      title: '任务名称',
      dataIndex: 'name',
      render: (v: string, r: PackingTask) => (
        <Button type="link" style={{ padding: 0 }} onClick={() => { setCurrentTask(r); setView('packing-detail'); loadTaskDetail(r.id) }}>
          <span style={{ fontWeight: 500 }}>{v}</span>
        </Button>
      ),
    },
    {
      title: '关联套装',
      dataIndex: 'set_info',
      width: 150,
      render: (v: OutfitSet | null) => v?.name || '-',
    },
    {
      title: '出行场景',
      dataIndex: 'scene_display',
      width: 120,
      render: (v: string | null, r: PackingTask) => {
        const scene = outfitSceneOptions.find(s => s.value === r.scene)
        return v ? <Tag>{scene?.emoji} {v}</Tag> : '-'
      },
    },
    {
      title: '出行日期',
      dataIndex: 'trip_date',
      width: 120,
      render: (v: string | null) => v || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: string) => (
        <Tag color={packingTaskStatusColors[v]}>
          {packingTaskStatusOptions.find(o => o.value === v)?.label}
        </Tag>
      ),
    },
    {
      title: '打包完成时间',
      dataIndex: 'packing_completed_at',
      width: 160,
      render: (v: string | null) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-',
    },
  ]

  if (!selectedBaby) {
    return (
      <BabySelector title="出行打包" description="创建衣物搭配套装，一键生成出行打包清单，智能检查衣物可用性，支持替换和确认。">
        <Empty description="请先选择宝宝" />
      </BabySelector>
    )
  }

  return (
    <BabySelector
      title="出行打包"
      description="管理衣物搭配套装，一键生成出行打包清单，智能检查衣物状态，支持替换和确认。"
    >
      {view === 'sets' && (
        <div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
            <Tabs
              activeKey={activeTab}
              onChange={(key) => setActiveTab(key as any)}
              items={[
                { key: 'sets', label: <span><ShoppingOutlined /> 套装管理</span> },
                { key: 'history', label: <span><HistoryOutlined /> 使用记录</span> },
              ]}
              style={{ marginBottom: 0 }}
            />
            <Space>
              {activeTab === 'sets' && (
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreateSet}>
                  新建套装
                </Button>
              )}
            </Space>
          </div>

          {activeTab === 'sets' && (
            <>
              <Card size="small" style={{ marginBottom: 16 }}>
                <Space wrap>
                  <span style={{ color: '#666' }}>筛选：</span>
                  <Select
                    placeholder="场景"
                    style={{ width: 140 }}
                    allowClear
                    value={filterScene || undefined}
                    onChange={setFilterScene}
                    options={outfitSceneOptions.map(o => ({ value: o.value, label: `${o.emoji} ${o.label}` }))}
                  />
                  <Select
                    placeholder="季节"
                    style={{ width: 120 }}
                    allowClear
                    value={filterSeason || undefined}
                    onChange={setFilterSeason}
                    options={seasonOptions}
                  />
                </Space>
              </Card>

              <Table
                rowKey="id"
                loading={loading}
                columns={setColumns}
                dataSource={sets}
                scroll={{ x: 1100 }}
                pagination={{ pageSize: 10 }}
                locale={{ emptyText: <Empty description="暂无套装，点击「新建套装」开始创建" /> }}
              />
            </>
          )}

          {activeTab === 'history' && (
            <Table
              rowKey="id"
              columns={packingTaskColumns}
              dataSource={packingTasks}
              scroll={{ x: 900 }}
              pagination={{ pageSize: 10 }}
              locale={{ emptyText: <Empty description="暂无打包记录" /> }}
            />
          )}
        </div>
      )}

      {view === 'set-detail' && currentSet && (
        <div style={{ padding: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <Button icon={<ArrowLeftOutlined />} onClick={goBack}>返回列表</Button>
            <Divider type="vertical" style={{ height: 28 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: 20 }}>{currentSet.name}</h2>
                <Tag color="blue" style={{ fontSize: 14, padding: '2px 10px' }}>
                  {outfitSceneOptions.find(s => s.value === currentSet.scene)?.emoji} {currentSet.scene_display}
                </Tag>
                <Tag style={{ fontSize: 14, padding: '2px 10px' }}>
                  {currentSet.season_display}
                </Tag>
              </div>
              <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>
                <SafetyOutlined /> 使用次数：{currentSet.use_count || 0} 次
                {currentSet.last_used_at && (
                  <span style={{ marginLeft: 16 }}>
                    <HistoryOutlined /> 最近使用：{dayjs(currentSet.last_used_at).format('YYYY-MM-DD')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {(currentSet.unavailable_count || 0) > 0 && (
            <Alert
              type="warning"
              showIcon
              icon={<ExclamationCircleOutlined />}
              message={`有 ${currentSet.unavailable_count} 件衣物暂不可打包`}
              description="这些衣物可能处于借出中、清洗中、待入柜或已送出状态，打包时需要替换。"
              style={{ marginBottom: 16 }}
            />
          )}

          <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
            <Col xs={12} sm={6}>
              <Card size="small" className="stat-card">
                <div style={{ color: '#888', fontSize: 12 }}>物品总数</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#1890ff' }}>{currentSet.item_count || 0}</div>
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small" className="stat-card">
                <div style={{ color: '#888', fontSize: 12 }}>可用衣物</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#52c41a' }}>{currentSet.available_count || 0}</div>
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small" className="stat-card">
                <div style={{ color: '#888', fontSize: 12 }}>不可用衣物</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#ff4d4f' }}>{currentSet.unavailable_count || 0}</div>
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small" className="stat-card">
                <div style={{ color: '#888', fontSize: 12 }}>备用数量</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#722ed1' }}>{currentSet.backup_count}</div>
              </Card>
            </Col>
          </Row>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
            <Space wrap>
              <Button icon={<EditOutlined />} onClick={() => openEditSet(currentSet)}>编辑套装</Button>
              <Button icon={<PlusOutlined />} type="primary" onClick={openAddItem}>添加衣物</Button>
            </Space>
            <Space>
              <Button
                type="primary"
                icon={<CarryOutOutlined />}
                onClick={() => openCreatePacking(currentSet)}
              >
                生成打包清单
              </Button>
            </Space>
          </div>

          <Table
            rowKey="id"
            loading={detailLoading}
            columns={setItemColumns}
            dataSource={currentSet.set_items || []}
            scroll={{ x: 900 }}
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: <Empty description="暂无衣物，点击「添加衣物」开始搭配" /> }}
          />

          {currentSet.note && (
            <Card size="small" style={{ marginTop: 16 }} title="备注">
              <div style={{ color: '#666' }}>{currentSet.note}</div>
            </Card>
          )}
        </div>
      )}

      {view === 'packing-detail' && currentTask && (
        <div style={{ padding: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <Button icon={<ArrowLeftOutlined />} onClick={goBack}>返回</Button>
            <Divider type="vertical" style={{ height: 28 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: 20 }}>{currentTask.name}</h2>
                <Tag color={packingTaskStatusColors[currentTask.status]} style={{ fontSize: 14, padding: '2px 10px' }}>
                  {packingTaskStatusOptions.find(o => o.value === currentTask.status)?.label}
                </Tag>
              </div>
              <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>
                {currentTask.set_info && (
                  <span><ShoppingOutlined /> 套装：{currentTask.set_info.name} &nbsp;&nbsp;</span>
                )}
                {currentTask.trip_date && (
                  <span><CalendarOutlined /> 出行日期：{currentTask.trip_date}</span>
                )}
                {currentTask.packing_completed_at && (
                  <span style={{ marginLeft: 16, color: '#52c41a' }}>
                    <CheckCircleOutlined /> 打包完成：{dayjs(currentTask.packing_completed_at).format('YYYY-MM-DD HH:mm')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {currentTask.stats && (
            <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
              <Col xs={12} sm={4}>
                <Card size="small" className="stat-card">
                  <div style={{ color: '#888', fontSize: 12 }}>总物品</div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>{currentTask.stats.total}</div>
                </Card>
              </Col>
              <Col xs={12} sm={4}>
                <Card size="small" className="stat-card">
                  <div style={{ color: '#888', fontSize: 12 }}>已打包</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#52c41a' }}>{currentTask.stats.packed}</div>
                </Card>
              </Col>
              <Col xs={12} sm={4}>
                <Card size="small" className="stat-card">
                  <div style={{ color: '#888', fontSize: 12 }}>已替换</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#fa8c16' }}>{currentTask.stats.replaced}</div>
                </Card>
              </Col>
              <Col xs={12} sm={4}>
                <Card size="small" className="stat-card">
                  <div style={{ color: '#888', fontSize: 12 }}>缺失</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#ff4d4f' }}>{currentTask.stats.missing}</div>
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card size="small" className="stat-card">
                  <div style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>打包进度</div>
                  <Progress percent={currentTask.stats.progress} status={currentTask.status === 'completed' ? 'success' : 'active'} />
                </Card>
              </Col>
            </Row>
          )}

          {currentTask.status !== 'completed' && (
            <div style={{ marginBottom: 16, textAlign: 'right' }}>
              <Popconfirm
                title="确认完成打包？"
                description="完成后将记录打包时间并更新套装使用次数。"
                onConfirm={handleCompletePacking}
                okText="确认完成"
                cancelText="继续打包"
              >
                <Button type="primary" icon={<CheckCircleOutlined />}>
                  完成打包
                </Button>
              </Popconfirm>
            </div>
          )}

          <PackingItemGroup
            title="必带物品"
            icon={<SafetyOutlined />}
            items={currentTask.grouped_items?.must || []}
            taskId={currentTask.id}
            isCompleted={currentTask.status === 'completed'}
            onPacked={handleMarkPacked}
            onMissing={handleMarkMissing}
            onReplace={handleReplaceItem}
            onRefresh={() => loadTaskDetail(currentTask.id)}
          />

          <PackingItemGroup
            title="可选物品"
            icon={<BulbOutlined />}
            items={currentTask.grouped_items?.optional || []}
            taskId={currentTask.id}
            isCompleted={currentTask.status === 'completed'}
            onPacked={handleMarkPacked}
            onMissing={handleMarkMissing}
            onReplace={handleReplaceItem}
            onRefresh={() => loadTaskDetail(currentTask.id)}
          />

          {(currentTask.grouped_items?.need_replace?.length || 0) > 0 && (
            <PackingItemGroup
              title="需替换物品"
              icon={<SwapOutlined />}
              items={currentTask.grouped_items?.need_replace || []}
              taskId={currentTask.id}
              isCompleted={currentTask.status === 'completed'}
              onPacked={handleMarkPacked}
              onMissing={handleMarkMissing}
              onReplace={handleReplaceItem}
              onRefresh={() => loadTaskDetail(currentTask.id)}
              isWarning
            />
          )}

          {(currentTask.grouped_items?.missing?.length || 0) > 0 && (
            <PackingItemGroup
              title="缺失物品"
              icon={<ExclamationCircleOutlined />}
              items={currentTask.grouped_items?.missing || []}
              taskId={currentTask.id}
              isCompleted={currentTask.status === 'completed'}
              onPacked={handleMarkPacked}
              onMissing={handleMarkMissing}
              onReplace={handleReplaceItem}
              onRefresh={() => loadTaskDetail(currentTask.id)}
              isDanger
            />
          )}
        </div>
      )}

      <Modal
        title={editingSet ? '编辑套装' : '新建套装'}
        open={setModalOpen}
        onCancel={() => setSetModalOpen(false)}
        onOk={() => setForm.submit()}
        width={560}
        okText={editingSet ? '保存' : '创建'}
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={setForm} layout="vertical" onFinish={handleSaveSet}>
          <Form.Item name="name" label="套装名称" rules={[{ required: true, message: '请输入套装名称' }]}>
            <Input placeholder="如：日常外出套装、幼儿园备用包" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="scene" label="适用场景" rules={[{ required: true }]}>
                <Select
                  options={outfitSceneOptions.map(o => ({
                    value: o.value,
                    label: `${o.emoji} ${o.label}`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="season" label="适用季节" rules={[{ required: true }]}>
                <Select options={seasonOptions} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="min_temperature" label="最低温度(℃)">
                <InputNumber style={{ width: '100%' }} placeholder="如：10" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="max_temperature" label="最高温度(℃)">
                <InputNumber style={{ width: '100%' }} placeholder="如：25" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="backup_count" label="备用数量">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={3} placeholder="套装使用说明、注意事项等" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingSetItem ? '编辑衣物' : '添加衣物'}
        open={itemModalOpen}
        onCancel={() => setItemModalOpen(false)}
        onOk={() => itemForm.submit()}
        width={520}
        okText={editingSetItem ? '保存' : '添加'}
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={itemForm} layout="vertical" onFinish={handleSaveItem}>
          {!editingSetItem && (
            <Form.Item name="item" label="选择衣物" rules={[{ required: true, message: '请选择衣物' }]}>
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="搜索并选择衣物"
                options={availableItems.map(item => ({
                  value: item.id,
                  label: `${item.name} (${item.size_label})`,
                }))}
              />
            </Form.Item>
          )}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="item_type" label="物品类型" rules={[{ required: true }]}>
                <Select options={itemTypeOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="quantity" label="数量" rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={2} placeholder="如：穿在外层、搭配帽子等" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="生成打包清单"
        open={packingModalOpen}
        onCancel={() => setPackingModalOpen(false)}
        onOk={() => packingForm.submit()}
        width={480}
        okText="创建"
        cancelText="取消"
        destroyOnHidden
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="系统将自动检查衣物可用性，不可用的衣物会标记为需替换。"
        />
        <Form form={packingForm} layout="vertical" onFinish={handleCreatePacking}>
          <Form.Item name="name" label="任务名称" rules={[{ required: true, message: '请输入任务名称' }]}>
            <Input placeholder="如：周末公园出行打包" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="scene" label="出行场景">
                <Select
                  options={outfitSceneOptions.map(o => ({
                    value: o.value,
                    label: `${o.emoji} ${o.label}`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="trip_date" label="出行日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={2} placeholder="打包注意事项等" />
          </Form.Item>
        </Form>
      </Modal>
    </BabySelector>
  )
}

function PackingItemGroup(props: {
  title: string
  icon: React.ReactNode
  items: PackingCheckRecord[]
  taskId: number
  isCompleted: boolean
  onPacked: (item: PackingCheckRecord) => void
  onMissing: (item: PackingCheckRecord) => void
  onReplace: (item: PackingCheckRecord, replaceItemId: number) => void
  onRefresh: () => void
  isWarning?: boolean
  isDanger?: boolean
}) {
  const [replaceModalVisible, setReplaceModalVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<PackingCheckRecord | null>(null)
  const [suggestions, setSuggestions] = useState<ClothingItem[]>([])
  const [selectedItem, setSelectedItem] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const antdApp = AntdApp.useApp()

  const openReplace = async (item: PackingCheckRecord) => {
    setCurrentItem(item)
    setSelectedItem(null)
    setLoading(true)
    try {
      const res = await api.getReplaceSuggestions(props.taskId, item.original_item || 0)
      setSuggestions(res.items)
    } catch (e) {
      antdApp.message.error('获取替换建议失败')
    } finally {
      setLoading(false)
    }
    setReplaceModalVisible(true)
  }

  const handleConfirmReplace = () => {
    if (!currentItem || !selectedItem) {
      antdApp.message.warning('请选择替换衣物')
      return
    }
    props.onReplace(currentItem, selectedItem)
    setReplaceModalVisible(false)
  }

  if (props.items.length === 0) {
    return null
  }

  const headerColor = props.isDanger ? '#ff4d4f' : props.isWarning ? '#fa8c16' : '#1890ff'

  return (
    <Card
      size="small"
      style={{ marginBottom: 16 }}
      title={
        <span style={{ color: headerColor }}>
          {props.icon} {props.title}
          <Tag style={{ marginLeft: 8 }}>{props.items.length} 件</Tag>
        </span>
      }
    >
      <List
        dataSource={props.items}
        renderItem={item => (
          <List.Item
            key={item.id}
            actions={
              !props.isCompleted
                ? [
                    <Button key="pack" type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => props.onPacked(item)}>
                      已打包
                    </Button>,
                    item.original_available && (
                      <Button key="replace" type="link" size="small" icon={<SwapOutlined />} onClick={() => openReplace(item)}>
                        替换
                      </Button>
                    ),
                    <Button key="missing" type="link" size="small" danger icon={<ExclamationCircleOutlined />} onClick={() => props.onMissing(item)}>
                      缺失
                    </Button>,
                  ].filter(Boolean) as React.ReactNode[]
                : []
            }
          >
            <List.Item.Meta
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 500 }}>{item.item_name}</span>
                  <Tag color={itemTypeTagColors[item.item_type]} style={{ fontSize: 11 }}>
                    {itemTypeOptions.find(o => o.value === item.item_type)?.label}
                  </Tag>
                  <Tag color={packingStatusTagColors[item.pack_status]} style={{ fontSize: 11 }}>
                    {packingStatusOptions.find(o => o.value === item.pack_status)?.label}
                  </Tag>
                  {!item.original_available && (
                    <Tag color="red" style={{ fontSize: 11 }}>原物不可用</Tag>
                  )}
                </div>
              }
              description={
                <div>
                  <div style={{ color: '#888', fontSize: 12 }}>
                    {categoryOptions.find(c => c.value === item.item_category)?.label || item.item_category}
                    {item.original_item_info?.size_label && ` · ${item.original_item_info.size_label}`}
                  </div>
                  {item.replaced_item_info && (
                    <div style={{ color: '#fa8c16', fontSize: 12, marginTop: 4 }}>
                      🔄 替换为：{item.replaced_item_info.name} ({item.replaced_item_info.size_label})
                    </div>
                  )}
                  {!item.original_available && item.original_item_info && (
                    <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>
                      原因：{item.original_item_info.care_status_display || '状态异常'}
                    </div>
                  )}
                </div>
              }
            />
          </List.Item>
        )}
      />

      <Modal
        title="选择替换衣物"
        open={replaceModalVisible}
        onCancel={() => setReplaceModalVisible(false)}
        onOk={handleConfirmReplace}
        okText="确认替换"
        cancelText="取消"
        width={500}
      >
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: '#666', marginBottom: 8 }}>原物品：{currentItem?.item_name}</div>
          <div style={{ color: '#888', fontSize: 12 }}>以下是同品类的可用衣物：</div>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 20 }}>加载中...</div>
        ) : suggestions.length === 0 ? (
          <Empty description="暂无可用的替换衣物" />
        ) : (
          <Radio.Group
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
            style={{ width: '100%' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {suggestions.map(item => (
                <Radio key={item.id} value={item.id}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{item.name}</div>
                    <div style={{ color: '#888', fontSize: 12 }}>
                      {item.size_label} · {item.condition_display}
                    </div>
                  </div>
                </Radio>
              ))}
            </div>
          </Radio.Group>
        )}
      </Modal>
    </Card>
  )
}
