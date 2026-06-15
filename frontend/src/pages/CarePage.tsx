import { useState, useEffect, useMemo } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Select,
  DatePicker,
  Input,
  InputNumber,
  Tabs,
  Empty,
  message,
  Checkbox,
  Tooltip,
  Divider,
  Badge,
  Dropdown,
  Menu,
  App as AntdApp,
  List,
  Avatar,
} from 'antd'
import {
  PlusOutlined,
  ReloadOutlined,
  TagsFilled,
  TagOutlined,
  CloudDownloadOutlined,
  MedicineBoxOutlined,
  DatabaseOutlined,
  UnorderedListOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  EditOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useBaby } from '../App'
import { api } from '../api'
import {
  careStatusOptions,
  careStatusBatchOptions,
  careStatusTagColors,
  washMethodOptions,
  sterilizeMethodOptions,
  dryMethodOptions,
  locationTypeOptions,
  careTypeOptions,
  categoryOptions,
  seasonOptions,
} from '../api'
import type {
  ClothingItem,
  CareStatus,
  StorageLocation,
  CareRecord,
  WashMethod,
  SterilizeMethod,
  DryMethod,
  CareType,
} from '../types'

const { TextArea } = Input
const { RangePicker } = DatePicker

export default function CarePage() {
  const { selectedBaby } = useBaby()
  const antdApp = AntdApp.useApp()

  const [loading, setLoading] = useState(false)
  const [pendingList, setPendingList] = useState<ClothingItem[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>([])
  const [locationsWithItems, setLocationsWithItems] = useState<StorageLocation[]>([])
  const [careRecords, setCareRecords] = useState<CareRecord[]>([])
  const [careSummary, setCareSummary] = useState<any>(null)

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [filterCategory, setFilterCategory] = useState<string | undefined>()
  const [filterSeason, setFilterSeason] = useState<string | undefined>()
  const [filterSize, setFilterSize] = useState<string | undefined>()
  const [filterCareStatus, setFilterCareStatus] = useState<CareStatus | undefined>()

  const [batchWashModalOpen, setBatchWashModalOpen] = useState(false)
  const [batchStoreModalOpen, setBatchStoreModalOpen] = useState(false)
  const [locationModalOpen, setLocationModalOpen] = useState(false)
  const [recordModalOpen, setRecordModalOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<StorageLocation | null>(null)

  const [washForm] = Form.useForm()
  const [storeForm] = Form.useForm()
  const [locationForm] = Form.useForm()
  const [recordForm] = Form.useForm()

  const babyId = selectedBaby?.id

  const sizeOptions = useMemo(() => {
    const sizes = new Set<string>()
    pendingList.forEach((item) => {
      if (item.size_label) sizes.add(item.size_label)
    })
    return Array.from(sizes).map((s) => ({ value: s, label: s }))
  }, [pendingList])

  const filteredPendingList = useMemo(() => {
    let list = [...pendingList]
    if (filterCategory) {
      list = list.filter((item) => item.category === filterCategory)
    }
    if (filterSeason) {
      list = list.filter((item) => item.season === filterSeason)
    }
    if (filterSize) {
      list = list.filter((item) => item.size_label === filterSize)
    }
    if (filterCareStatus) {
      list = list.filter((item) => item.care_status === filterCareStatus)
    }
    return list
  }, [pendingList, filterCategory, filterSeason, filterSize, filterCareStatus])

  useEffect(() => {
    if (babyId) {
      loadAllData()
    }
  }, [babyId])

  const loadAllData = async () => {
    if (!babyId) return
    setLoading(true)
    try {
      const [pending, locations, locationsWithItemsRes, records, summary] = await Promise.all([
        api.getClothingPendingList(babyId),
        api.getStorageLocations({ baby: babyId }),
        api.getStorageLocationsWithItems(babyId),
        api.getCareRecords({ baby: babyId }),
        api.getClothingCareSummary(babyId),
      ])
      setPendingList(pending.items)
      setPendingCount(pending.count)
      setStorageLocations(locations)
      setLocationsWithItems(locationsWithItemsRes.locations)
      setCareRecords(records)
      setCareSummary(summary)
    } catch (e: any) {
      antdApp.message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleBatchStatus = async (status: CareStatus) => {
    if (selectedRowKeys.length === 0) {
      antdApp.message.warning('请先选择衣物')
      return
    }
    try {
      const res = await api.batchUpdateCareStatus(selectedRowKeys.map(Number), status)
      antdApp.message.success(res.message)
      await loadAllData()
      setSelectedRowKeys([])
    } catch (e: any) {
      antdApp.message.error(e.response?.data?.error || '操作失败')
    }
  }

  const handleBatchWash = async () => {
    try {
      const values = await washForm.validateFields()
      const res = await api.batchWashClothing({
        ...values,
        item_ids: selectedRowKeys.map(Number),
        care_date: values.care_date ? values.care_date.format('YYYY-MM-DD') : undefined,
      })
      antdApp.message.success(res.message)
      setBatchWashModalOpen(false)
      washForm.resetFields()
      await loadAllData()
      setSelectedRowKeys([])
    } catch (e: any) {
      if (e.errorFields) return
      antdApp.message.error('操作失败')
    }
  }

  const handleBatchStore = async () => {
    try {
      const values = await storeForm.validateFields()
      const res = await api.batchStoreClothing({
        ...values,
        item_ids: selectedRowKeys.map(Number),
        care_date: values.care_date ? values.care_date.format('YYYY-MM-DD') : undefined,
      })
      antdApp.message.success(res.message)
      setBatchStoreModalOpen(false)
      storeForm.resetFields()
      await loadAllData()
      setSelectedRowKeys([])
    } catch (e: any) {
      if (e.errorFields) return
      antdApp.message.error('操作失败')
    }
  }

  const handleSaveLocation = async () => {
    try {
      const values = await locationForm.validateFields()
      const payload = { ...values, baby: babyId }
      if (editingLocation) {
        await api.updateStorageLocation(editingLocation.id, payload)
        antdApp.message.success('位置更新成功')
      } else {
        await api.createStorageLocation(payload)
        antdApp.message.success('位置创建成功')
      }
      setLocationModalOpen(false)
      setEditingLocation(null)
      locationForm.resetFields()
      await loadAllData()
    } catch (e: any) {
      if (e.errorFields) return
      antdApp.message.error('保存失败')
    }
  }

  const handleSaveRecord = async () => {
    try {
      const values = await recordForm.validateFields()
      const payload = {
        ...values,
        care_date: values.care_date ? values.care_date.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
      }
      await api.createCareRecord(payload)
      antdApp.message.success('护理记录创建成功')
      setRecordModalOpen(false)
      recordForm.resetFields()
      await loadAllData()
    } catch (e: any) {
      if (e.errorFields) return
      antdApp.message.error('保存失败')
    }
  }

  const openEditLocation = (loc: StorageLocation) => {
    setEditingLocation(loc)
    locationForm.setFieldsValue({
      name: loc.name,
      location_type: loc.location_type,
      container_name: loc.container_name,
      area: loc.area,
      shelf_level: loc.shelf_level,
      sort_order: loc.sort_order,
      note: loc.note,
    })
    setLocationModalOpen(true)
  }

  const openCreateLocation = () => {
    setEditingLocation(null)
    locationForm.resetFields()
    setLocationModalOpen(true)
  }

  const pendingColumns: ColumnsType<ClothingItem> = [
    {
      title: '物品',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#888' }}>
            {record.category_display} · {record.size_label} · {record.season_display}
          </div>
        </div>
      ),
    },
    {
      title: '护理状态',
      dataIndex: 'care_status',
      key: 'care_status',
      width: 120,
      render: (status) => (
        <Tag color={careStatusTagColors[status] || 'default'}>
          {careStatusOptions.find((o) => o.value === status)?.label || status}
        </Tag>
      ),
    },
    {
      title: '上次清洗',
      dataIndex: 'last_wash_date',
      key: 'last_wash_date',
      width: 120,
      render: (date, record) => (
        <div>
          <div>{date || '暂无记录'}</div>
          {record.days_since_last_wash != null && (
            <div style={{ fontSize: 12, color: '#888' }}>
              {record.days_since_last_wash}天前
            </div>
          )}
        </div>
      ),
    },
    {
      title: '收纳位置',
      dataIndex: 'storage_location_info',
      key: 'storage_location_info',
      width: 160,
      render: (loc) =>
        loc ? (
          <div>
            <div>{loc.name}</div>
            {loc.container_name && (
              <div style={{ fontSize: 12, color: '#888' }}>容器: {loc.container_name}</div>
            )}
          </div>
        ) : (
          <span style={{ color: '#aaa' }}>未设置</span>
        ),
    },
    {
      title: '品牌/成色',
      key: 'brand',
      width: 140,
      render: (_, record) => (
        <div>
          {record.brand && <div>{record.brand}</div>}
          <Tag>{record.condition_display}</Tag>
        </div>
      ),
    },
  ]

  const recordColumns: ColumnsType<CareRecord> = [
    {
      title: '护理日期',
      dataIndex: 'care_date',
      key: 'care_date',
      width: 120,
    },
    {
      title: '类型',
      dataIndex: 'care_type',
      key: 'care_type',
      width: 100,
      render: (t, r) => <Tag color="blue">{r.care_type_display || t}</Tag>,
    },
    {
      title: '衣物',
      key: 'item',
      render: (_, r) => (
        <div>
          <div>{r.item_name}</div>
          <div style={{ fontSize: 12, color: '#888' }}>{r.item_size_label}</div>
        </div>
      ),
    },
    {
      title: '方式/详情',
      key: 'details',
      render: (_, r) => (
        <div>
          {r.wash_method_display && <div>清洗: {r.wash_method_display}</div>}
          {r.dry_method_display && <div>晾晒: {r.dry_method_display}</div>}
          {r.sterilize_method_display && r.sterilize_method !== 'none' && (
            <div>消毒: {r.sterilize_method_display}</div>
          )}
          {r.detergent_used && <div style={{ fontSize: 12, color: '#888' }}>洗涤剂: {r.detergent_used}</div>}
          {r.water_temperature && <div style={{ fontSize: 12, color: '#888' }}>水温: {r.water_temperature}</div>}
        </div>
      ),
    },
    {
      title: '收纳位置',
      dataIndex: 'storage_location_info',
      key: 'storage_location_info',
      render: (loc) => (loc ? loc.name : '-'),
    },
    {
      title: '备注',
      dataIndex: 'care_note',
      key: 'care_note',
      ellipsis: true,
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      key: 'operator',
      width: 100,
    },
  ]

  const renderStatsCards = () => (
    <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
      <Col xs={12} sm={8} md={4}>
        <Card className="stat-card">
          <Statistic
            title="待处理总数"
            value={careSummary?.pending_count || pendingCount}
            valueStyle={{ color: '#cf1322' }}
            prefix={<SyncOutlined spin={!!(careSummary?.pending_count || pendingCount)} />}
          />
        </Card>
      </Col>
      <Col xs={12} sm={8} md={4}>
        <Card className="stat-card">
          <Statistic
            title="待清洗"
            value={careSummary?.to_wash_count || 0}
            valueStyle={{ color: '#d46b08' }}
            prefix={<TagsFilled />}
          />
        </Card>
      </Col>
      <Col xs={12} sm={8} md={4}>
        <Card className="stat-card">
          <Statistic
            title="需消毒"
            value={careSummary?.to_sterilize_count || 0}
            valueStyle={{ color: '#c41d7f' }}
            prefix={<MedicineBoxOutlined />}
          />
        </Card>
      </Col>
      <Col xs={12} sm={8} md={4}>
        <Card className="stat-card">
          <Statistic
            title="待入柜"
            value={careSummary?.to_store_count || 0}
            valueStyle={{ color: '#1677ff' }}
            prefix={<DatabaseOutlined />}
          />
        </Card>
      </Col>
      <Col xs={12} sm={8} md={4}>
        <Card className="stat-card">
          <Statistic
            title="已入柜"
            value={careSummary?.stored_count || 0}
            valueStyle={{ color: '#389e0d' }}
            prefix={<CheckCircleOutlined />}
          />
        </Card>
      </Col>
      <Col xs={12} sm={8} md={4}>
        <Card className="stat-card">
          <Statistic
            title="近30天清洗"
            value={careSummary?.recent_30d_wash_count || 0}
            valueStyle={{ color: '#0050b3' }}
            prefix={<CloudDownloadOutlined />}
          />
        </Card>
      </Col>
    </Row>
  )

  const renderFilters = () => (
    <Card style={{ marginBottom: 16 }}>
      <Space wrap size="middle">
        <Select
          placeholder="按品类筛选"
          allowClear
          style={{ width: 140 }}
          options={categoryOptions}
          value={filterCategory}
          onChange={setFilterCategory}
        />
        <Select
          placeholder="按季节筛选"
          allowClear
          style={{ width: 140 }}
          options={seasonOptions}
          value={filterSeason}
          onChange={setFilterSeason}
        />
        <Select
          placeholder="按尺码筛选"
          allowClear
          style={{ width: 140 }}
          options={sizeOptions}
          value={filterSize}
          onChange={setFilterSize}
        />
        <Select
          placeholder="按护理状态"
          allowClear
          style={{ width: 150 }}
          options={careStatusOptions}
          value={filterCareStatus}
          onChange={(v) => setFilterCareStatus(v as CareStatus)}
        />
        <Button icon={<ReloadOutlined />} onClick={() => {
          setFilterCategory(undefined)
          setFilterSeason(undefined)
          setFilterSize(undefined)
          setFilterCareStatus(undefined)
        }}>
          清除筛选
        </Button>
        <Button type="primary" icon={<ReloadOutlined />} onClick={loadAllData}>
          刷新数据
        </Button>
      </Space>
    </Card>
  )

  const renderBatchActions = () => (
    <Card style={{ marginBottom: 16 }}>
      <Space wrap size="middle">
        <span style={{ color: '#555' }}>
          已选择 <strong style={{ color: '#1677ff', fontSize: 16 }}>{selectedRowKeys.length}</strong> 件
        </span>
        <Divider type="vertical" />
        <Button
          type="primary"
          icon={<TagsFilled />}
          disabled={selectedRowKeys.length === 0}
          onClick={() => setBatchWashModalOpen(true)}
        >
          批量清洗
        </Button>
        <Button
          type="primary"
          icon={<DatabaseOutlined />}
          disabled={selectedRowKeys.length === 0}
          onClick={() => setBatchStoreModalOpen(true)}
        >
          批量入柜
        </Button>
        <Dropdown
          menu={{
            items: careStatusBatchOptions.map((o) => ({
              key: o.value,
              label: o.label,
              onClick: () => handleBatchStatus(o.value as CareStatus),
            })),
          }}
          disabled={selectedRowKeys.length === 0}
        >
          <Button icon={<TagOutlined />}>批量标记状态</Button>
        </Dropdown>
      </Space>
    </Card>
  )

  const renderPendingTab = () => (
    <>
      {renderFilters()}
      {renderBatchActions()}
      <Table
        rowKey="id"
        loading={loading}
        columns={pendingColumns}
        dataSource={filteredPendingList}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
          getCheckboxProps: (record: ClothingItem) => ({
            disabled: record.status === 'lent',
          }),
        }}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 件待处理衣物`,
        }}
        locale={{
          emptyText: <Empty description="太棒了！没有待处理的衣物 🎉" />,
        }}
      />
    </>
  )

  const renderRecordsTab = () => (
    <>
      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            recordForm.resetFields()
            setRecordModalOpen(true)
          }}
        >
          登记护理记录
        </Button>
      </div>
      <Table
        rowKey="id"
        loading={loading}
        columns={recordColumns}
        dataSource={careRecords}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条护理记录`,
        }}
        locale={{ emptyText: <Empty description="暂无护理记录" /> }}
      />
    </>
  )

  const renderLocationsTab = () => (
    <>
      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateLocation}>
          新增收纳位置
        </Button>
      </div>
      {locationsWithItems.length === 0 ? (
        <Empty description="还没有设置收纳位置，快去添加吧" />
      ) : (
        <Row gutter={[16, 16]}>
          {locationsWithItems.map((loc) => (
            <Col xs={24} sm={12} md={8} lg={6} key={loc.id}>
              <Badge.Ribbon
                text={loc.location_type_display}
                color="pink"
              >
                <Card
                  hoverable
                  actions={[
                    <Tooltip title="编辑">
                      <EditOutlined key="edit" onClick={() => openEditLocation(loc)} />
                    </Tooltip>,
                  ]}
                >
                  <Card.Meta
                    avatar={<Avatar icon={<DatabaseOutlined />} style={{ backgroundColor: '#ff85c0' }} />}
                    title={loc.name}
                    description={
                      <div>
                        {loc.container_name && <div>📦 {loc.container_name}</div>}
                        {loc.area && <div>📍 {loc.area}{loc.shelf_level ? ` · ${loc.shelf_level}` : ''}</div>}
                        <Divider style={{ margin: '8px 0' }} />
                        <div style={{ color: '#52c41a', fontWeight: 600 }}>
                          {loc.stored_item_count || 0} 件衣物
                        </div>
                      </div>
                    }
                  />
                  {(loc.stored_items?.length || 0) > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <Divider style={{ margin: '8px 0' }} />
                      <List
                        size="small"
                        dataSource={loc.stored_items?.slice(0, 3)}
                        renderItem={(item: ClothingItem) => (
                          <List.Item>
                            <List.Item.Meta
                              title={item.name}
                              description={`${item.category_display} · ${item.size_label}`}
                            />
                          </List.Item>
                        )}
                      />
                      {(loc.stored_items?.length || 0) > 3 && (
                        <div style={{ textAlign: 'center', color: '#999', fontSize: 12, marginTop: 4 }}>
                          还有 {(loc.stored_items?.length || 0) - 3} 件...
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              </Badge.Ribbon>
            </Col>
          ))}
        </Row>
      )}
    </>
  )

  const tabItems = [
    {
      key: 'pending',
      label: (
        <span>
          <UnorderedListOutlined />
          待处理清单
          {pendingCount > 0 && (
            <Badge count={pendingCount} size="small" style={{ marginLeft: 6 }} />
          )}
        </span>
      ),
      children: renderPendingTab(),
    },
    {
      key: 'records',
      label: (
        <span>
          <TagsFilled />
          清洗护理记录
        </span>
      ),
      children: renderRecordsTab(),
    },
    {
      key: 'locations',
      label: (
        <span>
          <DatabaseOutlined />
          收纳位置看板
        </span>
      ),
      children: renderLocationsTab(),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🧺 护理收纳中心</h1>
        <p className="page-description">
          管理衣物清洗、消毒、晾晒和收纳全流程，轻松定位每件衣物的位置
        </p>
      </div>

      {renderStatsCards()}

      <div className="page-content">
        <Tabs items={tabItems} defaultActiveKey="pending" />
      </div>

      <Modal
        title="批量登记清洗"
        open={batchWashModalOpen}
        onOk={handleBatchWash}
        onCancel={() => setBatchWashModalOpen(false)}
        okText="确认登记"
        width={520}
      >
        <Form form={washForm} layout="vertical">
          <div style={{ marginBottom: 12, color: '#666' }}>
            将为 <strong style={{ color: '#1677ff' }}>{selectedRowKeys.length}</strong> 件衣物登记清洗记录
          </div>
          <Form.Item label="清洗日期" name="care_date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="清洗方式" name="wash_method">
            <Select options={washMethodOptions} placeholder="选择清洗方式" />
          </Form.Item>
          <Form.Item label="消毒方式" name="sterilize_method">
            <Select options={sterilizeMethodOptions} placeholder="选择消毒方式" />
          </Form.Item>
          <Form.Item label="晾晒方式" name="dry_method">
            <Select options={dryMethodOptions} placeholder="选择晾晒方式" />
          </Form.Item>
          <Form.Item label="洗涤剂" name="detergent_used">
            <Input placeholder="例如：婴儿专用洗衣液" />
          </Form.Item>
          <Form.Item label="水温" name="water_temperature">
            <Input placeholder="例如：30度以下、冷水、温水" />
          </Form.Item>
          <Form.Item label="操作人" name="operator">
            <Input placeholder="例如：妈妈" />
          </Form.Item>
          <Form.Item label="备注" name="care_note">
            <TextArea rows={2} placeholder="护理备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="批量入柜"
        open={batchStoreModalOpen}
        onOk={handleBatchStore}
        onCancel={() => setBatchStoreModalOpen(false)}
        okText="确认入柜"
        width={520}
      >
        <Form form={storeForm} layout="vertical">
          <div style={{ marginBottom: 12, color: '#666' }}>
            将为 <strong style={{ color: '#1677ff' }}>{selectedRowKeys.length}</strong> 件衣物执行入柜操作
          </div>
          <Form.Item
            label="收纳位置"
            name="storage_location"
            rules={[{ required: true, message: '请选择收纳位置' }]}
          >
            <Select
              placeholder="选择收纳位置"
              options={storageLocations.map((l) => ({
                value: l.id,
                label: `${l.name}${l.container_name ? ` [${l.container_name}]` : ''}${l.area ? ` (${l.area})` : ''}`,
              }))}
            />
          </Form.Item>
          <Form.Item label="入柜日期" name="care_date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="操作人" name="operator">
            <Input placeholder="例如：爸爸" />
          </Form.Item>
          <Form.Item label="备注" name="care_note">
            <TextArea rows={2} placeholder="入柜备注" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingLocation ? '编辑收纳位置' : '新增收纳位置'}
        open={locationModalOpen}
        onOk={handleSaveLocation}
        onCancel={() => {
          setLocationModalOpen(false)
          setEditingLocation(null)
        }}
        okText="保存"
        width={520}
      >
        <Form form={locationForm} layout="vertical">
          <Form.Item
            label="位置名称"
            name="name"
            rules={[{ required: true, message: '请输入位置名称' }]}
          >
            <Input placeholder="例如：宝宝衣柜第二层" />
          </Form.Item>
          <Form.Item
            label="位置类型"
            name="location_type"
            rules={[{ required: true, message: '请选择位置类型' }]}
          >
            <Select options={locationTypeOptions} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="收纳容器/编号" name="container_name">
                <Input placeholder="例如：A-01 收纳箱" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="所在区域" name="area">
                <Input placeholder="例如：儿童房" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="层/格位置" name="shelf_level">
                <Input placeholder="例如：上层、第三格" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="排序权重" name="sort_order">
                <InputNumber style={{ width: '100%' }} min={0} defaultValue={0} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="备注" name="note">
            <TextArea rows={2} placeholder="位置描述备注" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="登记护理记录"
        open={recordModalOpen}
        onOk={handleSaveRecord}
        onCancel={() => setRecordModalOpen(false)}
        okText="保存"
        width={560}
      >
        <Form form={recordForm} layout="vertical">
          <Form.Item
            label="衣物"
            name="item"
            rules={[{ required: true, message: '请选择衣物' }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="搜索并选择衣物"
              options={pendingList.concat(careSummary?.long_not_stored_items || []).map((item: ClothingItem) => ({
                value: item.id,
                label: `${item.name} (${item.category_display} · ${item.size_label})`,
              }))}
            />
          </Form.Item>
          <Form.Item
            label="护理类型"
            name="care_type"
            rules={[{ required: true, message: '请选择护理类型' }]}
          >
            <Select options={careTypeOptions} />
          </Form.Item>
          <Form.Item label="护理日期" name="care_date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="清洗方式" name="wash_method">
            <Select options={washMethodOptions} allowClear />
          </Form.Item>
          <Form.Item label="晾晒方式" name="dry_method">
            <Select options={dryMethodOptions} allowClear />
          </Form.Item>
          <Form.Item label="消毒方式" name="sterilize_method">
            <Select options={sterilizeMethodOptions} allowClear />
          </Form.Item>
          <Form.Item label="收纳位置" name="storage_location">
            <Select
              allowClear
              placeholder="入柜时选择"
              options={storageLocations.map((l) => ({
                value: l.id,
                label: `${l.name}${l.container_name ? ` [${l.container_name}]` : ''}`,
              }))}
            />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="洗涤剂" name="detergent_used">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="水温" name="water_temperature">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="处理时长(分钟)" name="duration_minutes">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="操作人" name="operator">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="护理备注" name="care_note">
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
