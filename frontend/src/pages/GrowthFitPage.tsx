import { useState, useEffect } from 'react'
import BabySelector from '../components/BabySelector'
import { useBaby } from '../App'
import {
  Alert, Tag, Button, Empty, App as AntdApp, Card, Row, Col,
  Space, Divider, Progress
} from 'antd'
import { GiftOutlined, WarningOutlined, CheckOutlined, RiseOutlined } from '@ant-design/icons'
import { api } from '../api'
import type { GrowthFitData, ClothingItem } from '../types'

export default function GrowthFitPage() {
  const { selectedBaby } = useBaby()
  const antdApp = AntdApp.useApp()
  const [data, setData] = useState<GrowthFitData | null>(null)
  const [loading, setLoading] = useState(false)

  const loadData = async () => {
    if (!selectedBaby) return
    setLoading(true)
    try {
      const d = await api.getGrowthFit(selectedBaby.id)
      setData(d)
    } catch (e) {
      antdApp.message.error('加载成长适配数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedBaby])

  if (!selectedBaby) {
    return (
      <BabySelector title="成长适配" description="根据宝宝成长数据自动匹配衣物合身度，识别闲置和即将不合身衣物，提前预警。">
        <Empty description="请先选择宝宝" />
      </BabySelector>
    )
  }

  const handleMarkGive = async (item: ClothingItem) => {
    if (item.status === 'lent') {
      antdApp.message.warning('该衣物处于借出中状态，无法执行转送操作')
      return
    }
    try {
      await api.updateClothingItem(item.id, { status: 'to_give' })
      antdApp.message.success('已标记为待转送')
      loadData()
    } catch (e) {
      antdApp.message.error('操作失败')
    }
  }

  const renderItems = (list: ClothingItem[], type: string) => {
    if (list.length === 0) {
      return <Empty description={null} image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: 24 }} />
    }
    return (
      <Row gutter={[12, 12]}>
        {list.map((item) => (
          <Col xs={24} sm={12} md={8} key={item.id}>
            <Card
              size="small"
              style={{
                border: type === 'too_small' ? '1px solid #ffa39e' :
                        type === 'near_limit' ? '1px solid #ffd591' :
                        type === 'fits' ? '1px solid #b7eb8f' : '1px solid #91caff'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    {item.status === 'lent' && (
                      <Tag color="cyan" style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>暂不可整理</Tag>
                    )}
                  </div>
                  <Space size={4}>
                    <Tag color="blue" style={{ fontSize: 11 }}>{item.size_label}</Tag>
                    <Tag style={{ fontSize: 11 }}>{item.category_display}</Tag>
                  </Space>
                  {(item.fit_reason || type !== 'fits') && (
                    <div className="fit-reason">{item.fit_reason || '宝宝穿着还偏大'}</div>
                  )}
                  {item.status === 'lent' && item.current_borrow && (
                    <div style={{ marginTop: 6, fontSize: 11, color: '#fa8c16' }}>
                      👤 借予 {item.current_borrow.borrower_name}
                      {item.current_borrow.expected_return_date && ` · 预计 ${item.current_borrow.expected_return_date} 归还`}
                    </div>
                  )}
                </div>
              </div>
              <Divider style={{ margin: '10px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                <span style={{ color: '#888' }}>
                  {item.season_display} · {item.condition_display}
                </span>
                <Tag
                  color={
                    item.status === 'keep' ? 'default' :
                    item.status === 'to_give' ? 'orange' :
                    item.status === 'reserved' ? 'purple' :
                    item.status === 'lent' ? 'cyan' : 'green'
                  }
                  style={{ margin: 0 }}
                >
                  {item.status_display}
                </Tag>
              </div>
              {(type === 'too_small' || type === 'near_limit') && item.status === 'keep' && (
                <Button
                  type="primary"
                  size="small"
                  icon={<GiftOutlined />}
                  block
                  style={{ marginTop: 10 }}
                  onClick={() => handleMarkGive(item)}
                >
                  标记转送
                </Button>
              )}
            </Card>
          </Col>
        ))}
      </Row>
    )
  }

  const summary = data?.summary
  const tooSmallPct = summary && summary.total > 0 ? Math.round((summary.too_small / summary.total) * 100) : 0
  const nearLimitPct = summary && summary.total > 0 ? Math.round((summary.near_limit / summary.total) * 100) : 0
  const fitsPct = summary && summary.total > 0 ? Math.round((summary.fits / summary.total) * 100) : 0
  const tooBigPct = summary && summary.total > 0 ? Math.round((summary.too_big / summary.total) * 100) : 0
  const lentCount = summary?.lent || 0

  return (
    <BabySelector
      title="成长适配"
      description="系统根据宝宝最新的身高体重和月龄，自动计算每件衣物的合身度。红色为已不合身、橙色为即将不合身，可直接标记为待转送。"
    >
      {data?.warnings?.map((w, i) => (
        <Alert
          key={i}
          showIcon
          type={w.level === 'danger' ? 'error' : 'warning'}
          icon={w.level === 'danger' ? <WarningOutlined /> : <WarningOutlined />}
          message={w.text}
          className="warning-alert"
        />
      ))}

      {data && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} md={12}>
            <Card size="small">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ffd6e0, #ffeef2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 30
                }}>
                  👶
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 16, color: '#333' }}>
                    {data.baby.name}
                  </div>
                  <Row gutter={16} style={{ marginTop: 6 }}>
                    <Col>
                      <span style={{ color: '#888', fontSize: 12 }}>月龄</span>
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#c2185b' }}>{data.baby.age_months}月</div>
                    </Col>
                    <Col>
                      <span style={{ color: '#888', fontSize: 12 }}>身高</span>
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#1677ff' }}>
                        {data.baby.height ? `${data.baby.height}cm` : '未记录'}
                      </div>
                    </Col>
                    <Col>
                      <span style={{ color: '#888', fontSize: 12 }}>体重</span>
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#52c41a' }}>
                        {data.baby.weight ? `${data.baby.weight}kg` : '未记录'}
                      </div>
                    </Col>
                  </Row>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card size="small" title={
              <span className="section-title" style={{ marginBottom: 0 }}>
                <RiseOutlined />衣物合身度分布（共{summary?.total || 0}件）
              </span>
            }>
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span><Tag className="tag-too-small">不合身</Tag></span>
                    <span style={{ color: '#888' }}>{summary?.too_small || 0}件 ({tooSmallPct}%)</span>
                  </div>
                  <Progress percent={tooSmallPct} showInfo={false} strokeColor="#cf1322" size="small" />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span><Tag className="tag-near-limit">即将不合身</Tag></span>
                    <span style={{ color: '#888' }}>{summary?.near_limit || 0}件 ({nearLimitPct}%)</span>
                  </div>
                  <Progress percent={nearLimitPct} showInfo={false} strokeColor="#d46b08" size="small" />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span><Tag className="tag-fits">合身</Tag></span>
                    <span style={{ color: '#888' }}>{summary?.fits || 0}件 ({fitsPct}%)</span>
                  </div>
                  <Progress percent={fitsPct} showInfo={false} strokeColor="#389e0d" size="small" />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span><Tag className="tag-too-big">偏大</Tag></span>
                    <span style={{ color: '#888' }}>{summary?.too_big || 0}件 ({tooBigPct}%)</span>
                  </div>
                  <Progress percent={tooBigPct} showInfo={false} strokeColor="#0958d9" size="small" />
                </div>
                {lentCount > 0 && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span><Tag color="cyan">借出中</Tag></span>
                      <span style={{ color: '#888' }}>{lentCount}件（暂不可整理）</span>
                    </div>
                    <div style={{ height: 8, background: '#e6fffb', borderRadius: 4 }}>
                      <div style={{ height: '100%', width: `${(lentCount / (summary?.total || 1)) * 100}%`, background: '#13c2c2', borderRadius: 4 }} />
                    </div>
                  </div>
                )}
              </Space>
            </Card>
          </Col>
        </Row>
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card
            title={<h3 className="section-title" style={{ marginBottom: 0 }}>
              <WarningOutlined style={{ color: '#cf1322' }} />
              <span>已不合身（建议转送）</span>
              <Tag color="red" style={{ marginLeft: 8 }}>{summary?.too_small || 0}</Tag>
            </h3>}
            style={{ borderTop: '3px solid #cf1322' }}
          >
            {renderItems(data?.items.too_small || [], 'too_small')}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            title={<h3 className="section-title" style={{ marginBottom: 0 }}>
              <WarningOutlined style={{ color: '#d46b08' }} />
              <span>即将不合身（关注）</span>
              <Tag color="orange" style={{ marginLeft: 8 }}>{summary?.near_limit || 0}</Tag>
            </h3>}
            style={{ borderTop: '3px solid #d46b08' }}
          >
            {renderItems(data?.items.near_limit || [], 'near_limit')}
          </Card>
        </Col>
        <Col xs={24} md={14}>
          <Card
            title={<h3 className="section-title" style={{ marginBottom: 0 }}>
              <CheckOutlined style={{ color: '#389e0d' }} />
              <span>当前合身</span>
              <Tag color="green" style={{ marginLeft: 8 }}>{summary?.fits || 0}</Tag>
            </h3>}
            style={{ borderTop: '3px solid #389e0d' }}
          >
            {renderItems(data?.items.fits || [], 'fits')}
          </Card>
        </Col>
        <Col xs={24} md={10}>
          <Card
            title={<h3 className="section-title" style={{ marginBottom: 0 }}>
              <RiseOutlined style={{ color: '#0958d9' }} />
              <span>待穿（偏大）</span>
              <Tag color="blue" style={{ marginLeft: 8 }}>{summary?.too_big || 0}</Tag>
            </h3>}
            style={{ borderTop: '3px solid #0958d9' }}
          >
            {renderItems(data?.items.too_big || [], 'too_big')}
          </Card>
        </Col>
      </Row>
    </BabySelector>
  )
}
