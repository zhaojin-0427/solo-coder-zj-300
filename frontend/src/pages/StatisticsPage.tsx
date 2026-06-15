import { useState, useEffect } from 'react'
import BabySelector from '../components/BabySelector'
import { useBaby } from '../App'
import {
  App as AntdApp, Card, Row, Col, Tag, Progress, List, Alert, Empty, Divider
} from 'antd'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line
} from 'recharts'
import {
  WarningOutlined, BulbOutlined, FireOutlined, CheckCircleOutlined,
  UnorderedListOutlined, CalendarOutlined, SwapOutlined
} from '@ant-design/icons'
import { api } from '../api'
import type { Statistics } from '../types'

const STATUS_COLORS: Record<string, string> = {
  '自留': '#1677ff',
  '待转送': '#fa8c16',
  '已预定': '#722ed1',
  '已送出': '#52c41a',
  '借出中': '#13c2c2',
}

const SEASON_COLORS: Record<string, string> = {
  '春季': '#73d13d',
  '夏季': '#ff4d4f',
  '秋季': '#fa8c16',
  '冬季': '#1677ff',
  '四季': '#8c8c8c',
}

export default function StatisticsPage() {
  const { selectedBaby } = useBaby()
  const antdApp = AntdApp.useApp()
  const [data, setData] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(false)

  const loadData = async () => {
    if (!selectedBaby) return
    setLoading(true)
    try {
      const d = await api.getStatistics(selectedBaby.id)
      setData(d)
    } catch (e) {
      antdApp.message.error('加载统计数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedBaby])

  if (!selectedBaby) {
    return (
      <BabySelector title="数据统计" description="全方位分析衣橱使用情况：尺码使用周期、闲置率、转送成功率、高频缺失品类、季节性囤货建议。">
        <Empty description="请先选择宝宝" />
      </BabySelector>
    )
  }

  const ov = data?.overview
  const statusPieData = Object.entries(data?.status_distribution || {}).map(([name, value]) => ({ name, value }))
  const seasonPieData = Object.entries(data?.season_distribution || {}).map(([name, value]) => ({ name, value }))
  const categoryBarData = (data?.category_stats?.labels || []).map((label, idx) => ({
    name: label,
    数量: data?.category_stats?.values?.[idx] || 0,
  }))
  const monthlyLineData = (data?.monthly_transfers?.labels || []).map((label, idx) => ({
    month: label,
    转送数: data?.monthly_transfers?.values?.[idx] || 0,
  }))
  const sizeCycleData = data?.size_cycle || []

  return (
    <BabySelector
      title="数据统计"
      description="全方位分析衣橱使用情况，提供尺码使用周期、闲置率、转送成功率、缺失品类和囤货建议，帮助家庭精细化育儿整理。"
    >
      {/* Overview */}
      <h3 className="section-title"><CheckCircleOutlined /> 概览数据</h3>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} md={4}>
          <Card className="stat-card">
            <div className="stat-value">{ov?.total_items || 0}</div>
            <div className="stat-label">物品总数</div>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card className="stat-card">
            <div className="stat-value">¥{(ov?.total_value || 0).toFixed(0)}</div>
            <div className="stat-label">总投入</div>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card className="stat-card">
            <div style={{ marginBottom: 8 }}>
              <Progress
                type="dashboard"
                percent={ov?.idle_rate || 0}
                strokeColor="#fa8c16"
                size={60}
              />
            </div>
            <div className="stat-label">闲置率</div>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card className="stat-card">
            <div style={{ marginBottom: 8 }}>
              <Progress
                type="dashboard"
                percent={ov?.transfer_success_rate || 0}
                strokeColor="#52c41a"
                size={60}
              />
            </div>
            <div className="stat-label">转送成功率</div>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card className="stat-card">
            <div className="stat-value">{ov?.total_transfers || 0}</div>
            <div className="stat-label">转送总次数</div>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card className="stat-card">
            <div className="stat-value">{ov?.completed_transfers || 0}</div>
            <div className="stat-label">完成转送</div>
          </Card>
        </Col>
      </Row>

      {/* Borrow statistics */}
      {data?.borrow_stats && (
        <>
          <h3 className="section-title">
            <SwapOutlined style={{ color: '#13c2c2' }} /> 临时借穿统计
          </h3>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={12} sm={8} md={4}>
              <Card className="stat-card">
                <div className="stat-value" style={{ color: '#13c2c2' }}>
                  {data.borrow_stats.recent_30d_borrow_count || 0}
                </div>
                <div className="stat-label">近30天借出</div>
              </Card>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Card className="stat-card">
                <div style={{ marginBottom: 8 }}>
                  <Progress
                    type="dashboard"
                    percent={data.borrow_stats.on_time_return_rate || 0}
                    strokeColor="#52c41a"
                    size={60}
                  />
                </div>
                <div className="stat-label">按时归还率</div>
              </Card>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Card className="stat-card">
                <div className="stat-value" style={{ color: '#ff4d4f' }}>
                  {data.borrow_stats.overdue_count || 0}
                </div>
                <div className="stat-label">逾期未还</div>
              </Card>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Card className="stat-card">
                <div className="stat-value" style={{ color: '#fa8c16' }}>
                  {data.borrow_stats.condition_decline_count || 0}
                </div>
                <div className="stat-label">成色下降</div>
              </Card>
            </Col>
            <Col xs={12} sm={8} md={8}>
              <Card size="small" className="stat-card">
                <div className="stat-label" style={{ marginBottom: 8 }}>最常借出品类</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {data.borrow_stats.most_borrowed_categories?.length > 0 ? (
                    data.borrow_stats.most_borrowed_categories.map((cat, idx) => (
                      <Tag key={idx} color="cyan">
                        {cat.category} {cat.count}次
                      </Tag>
                    ))
                  ) : (
                    <span style={{ color: '#888' }}>暂无借穿记录</span>
                  )}
                </div>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {/* Charts row 1 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={10}>
          <div className="chart-card">
            <h3 className="section-title"><UnorderedListOutlined /> 状态分布</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#bbb' }}
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={index} fill={STATUS_COLORS[entry.name] || `hsl(${index * 60},70%,60%)`} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Col>
        <Col xs={24} md={14}>
          <div className="chart-card">
            <h3 className="section-title"><BarChart /> 品类分布</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={categoryBarData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                <XAxis type="number" fontSize={11} />
                <YAxis dataKey="name" type="category" width={70} fontSize={11} />
                <Tooltip />
                <Bar dataKey="数量" fill="#ff85a1" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Col>
      </Row>

      {/* Charts row 2 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <div className="chart-card">
            <h3 className="section-title"><CalendarOutlined /> 季节分布</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={seasonPieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  dataKey="value"
                  label={({ name, value }) => `${name}:${value}`}
                >
                  {seasonPieData.map((entry, index) => (
                    <Cell key={index} fill={SEASON_COLORS[entry.name] || `hsl(${index * 90},60%,60%)`} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Col>
        <Col xs={24} md={16}>
          <div className="chart-card">
            <h3 className="section-title">📏 尺码使用周期（平均使用天数）</h3>
            {sizeCycleData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={sizeCycleData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                  <XAxis dataKey="size" fontSize={11} />
                  <YAxis fontSize={11} label={{ value: '天', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#888' } }} />
                  <Tooltip formatter={(v) => [`${v}天`, '平均使用']} />
                  <Bar
                    dataKey="avg_cycle_days"
                    name="平均使用天数"
                    fill="#1677ff"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="count"
                    name="样本数"
                    fill="#52c41a"
                    radius={[6, 6, 0, 0]}
                  />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="暂无足够数据（需要物品有购入日期和转送记录）" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </div>
        </Col>
      </Row>

      {/* Charts row 3 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <div className="chart-card">
            <h3 className="section-title">📅 月度转送趋势</h3>
            {monthlyLineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={monthlyLineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                  <XAxis dataKey="month" fontSize={11} />
                  <YAxis fontSize={11} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="转送数"
                    stroke="#722ed1"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#fff', stroke: '#722ed1', strokeWidth: 2 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="暂无转送数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </div>
        </Col>
      </Row>

      {/* Missing + Suggestions */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card
            title={<h3 className="section-title" style={{ marginBottom: 0 }}>
              <FireOutlined style={{ color: '#cf1322' }} />
              高频缺失品类提醒
            </h3>}
          >
            {(data?.missing_categories || []).length === 0 ? (
              <Alert
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
                message="当前尺码段品类齐全！"
                description="常用品类数量充足，可根据孩子的喜好和风格个性化补充。"
              />
            ) : (
              <List
                itemLayout="horizontal"
                dataSource={data?.missing_categories || []}
                renderItem={(item) => (
                  <List.Item style={{ borderBottom: 'none', padding: '10px 0' }}>
                    <List.Item.Meta
                      avatar={
                        <div
                          style={{
                            width: 40, height: 40, borderRadius: 8,
                            background: item.urgency === 'high' ? '#fff1f0' : '#fff7e6',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: item.urgency === 'high' ? '#cf1322' : '#d46b08',
                            fontSize: 18
                          }}
                        >
                          <WarningOutlined />
                        </div>
                      }
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 600 }}>{item.category}</span>
                          <Tag color={item.urgency === 'high' ? 'red' : 'orange'}>
                            {item.urgency === 'high' ? '急需' : '建议补充'}
                          </Tag>
                        </div>
                      }
                      description={
                        <div style={{ fontSize: 12, color: '#888' }}>
                          当前：{item.current_count}件 · 建议备：{item.recommended_count}件
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            title={<h3 className="section-title" style={{ marginBottom: 0 }}>
              <BulbOutlined style={{ color: '#722ed1' }} />
              季节性囤货建议
            </h3>}
          >
            {(data?.stock_suggestions || []).length === 0 ? (
              <Alert
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
                message="储备充足！"
                description="当前储备完全可以应对近期需求，请继续保持。"
              />
            ) : (
              <List
                dataSource={data?.stock_suggestions || []}
                renderItem={(item) => (
                  <List.Item style={{ alignItems: 'flex-start' }}>
                    <List.Item.Meta
                      avatar={
                        <div
                          style={{
                            width: 40, height: 40, borderRadius: 8,
                            background: item.priority === 'high' ? '#fff1f0' : '#e6f4ff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: item.priority === 'high' ? '#cf1322' : '#0958d9',
                            fontSize: 18
                          }}
                        >
                          {item.priority === 'high' ? <FireOutlined /> : <BulbOutlined />}
                        </div>
                      }
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 600 }}>{item.title}</span>
                          <Tag color={item.priority === 'high' ? 'red' : 'blue'}>
                            {item.priority === 'high' ? '高优先级' : '中优先级'}
                          </Tag>
                        </div>
                      }
                      description={<div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>{item.content}</div>}
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Season plan stats */}
      {data?.season_plan_stats && (data.season_plan_stats.recent_plans.length > 0 || data.season_plan_stats.next_season_gap_summary.length > 0) && (
        <>
          <Divider />
          <h3 className="section-title" style={{ marginTop: 8 }}>
            <CalendarOutlined style={{ color: '#1677ff' }} /> 换季整理计划回顾
          </h3>

          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={12} sm={8}>
              <Card size="small" className="stat-card">
                <div style={{ color: '#888', fontSize: 12 }}>近3次计划平均完成率</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 24, fontWeight: 700, color: '#1677ff' }}>
                    {data.season_plan_stats.avg_completion_rate}%
                  </span>
                </div>
                <Progress
                  percent={data.season_plan_stats.avg_completion_rate}
                  size="small"
                  style={{ marginTop: 8 }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8}>
              <Card size="small" className="stat-card">
                <div style={{ color: '#888', fontSize: 12 }}>转送转化总数</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#52c41a' }}>
                  {data.season_plan_stats.total_transfer_converted}
                  <span style={{ fontSize: 12, color: '#888', fontWeight: 400, marginLeft: 4 }}>件</span>
                </div>
                <div style={{ color: '#888', fontSize: 12, marginTop: 8 }}>
                  计划中标记待转送+已预定
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small" className="stat-card">
                <div style={{ color: '#888', fontSize: 12 }}>下一季主要缺口</div>
                {data.season_plan_stats.next_season_gap_summary.length > 0 ? (
                  <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {data.season_plan_stats.next_season_gap_summary.slice(0, 4).map(g => (
                      <Tag key={g.code} color="purple">
                        {g.category} 缺{g.total_gap}件
                      </Tag>
                    ))}
                  </div>
                ) : (
                  <div style={{ marginTop: 4, fontSize: 16, fontWeight: 700, color: '#52c41a' }}>
                    ✅ 储备充足
                  </div>
                )}
              </Card>
            </Col>
          </Row>

          {data.season_plan_stats.recent_plans.length > 0 && (
            <Row gutter={[16, 16]}>
              <Col xs={24} md={24}>
                <Card
                  title={<h3 className="section-title" style={{ marginBottom: 0 }}>
                    <UnorderedListOutlined style={{ color: '#722ed1' }} />
                    近 3 次整理计划详情
                  </h3>}
                >
                  <List
                    dataSource={data.season_plan_stats.recent_plans}
                    renderItem={(plan) => (
                      <List.Item style={{ alignItems: 'flex-start', padding: '14px 0' }}>
                        <List.Item.Meta
                          avatar={
                            <div
                              style={{
                                width: 44, height: 44, borderRadius: 10,
                                background: plan.status === 'completed' ? '#f6ffed' : plan.status === 'in_progress' ? '#e6f4ff' : '#fafafa',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: plan.status === 'completed' ? '#52c41a' : plan.status === 'in_progress' ? '#1677ff' : '#8c8c8c',
                                fontSize: 20
                              }}
                            >
                              {plan.status === 'completed' ? <CheckCircleOutlined /> : plan.status === 'in_progress' ? <Progress type="dashboard" percent={plan.completion_rate} size={30} /> : <CalendarOutlined />}
                            </div>
                          }
                          title={
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 600, fontSize: 15 }}>{plan.plan_name}</span>
                              <Tag color="blue">{plan.target_season_display}</Tag>
                              <Tag color={plan.status === 'completed' ? 'green' : plan.status === 'in_progress' ? 'blue' : 'default'}>
                                {plan.status_display}
                              </Tag>
                            </div>
                          }
                          description={
                            <div style={{ marginTop: 10 }}>
                              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 8, color: '#666', fontSize: 13 }}>
                                <span>📅 计划：{plan.plan_date}</span>
                                {plan.completed_date && <span>✅ 完成：{plan.completed_date}</span>}
                                <span>📦 物品：{plan.total_items}件</span>
                                <span>🎁 建议转送：{plan.suggest_transfer_count}件</span>
                                <span>💝 已转送/预定：{plan.actual_transfer_count}件</span>
                                <span>🔄 转送转化率：{plan.transfer_conversion_rate}%</span>
                              </div>
                              <div style={{ marginBottom: 6 }}>
                                <Progress
                                  percent={plan.completion_rate}
                                  size="small"
                                  status={plan.status === 'completed' ? 'success' : 'active'}
                                />
                              </div>
                              {plan.next_season_gaps.length > 0 && (
                                <div style={{ marginTop: 10, padding: 10, background: '#f9f0ff', borderRadius: 6 }}>
                                  <div style={{ fontSize: 12, color: '#531dab', marginBottom: 4, fontWeight: 600 }}>
                                    📦 下一季待准备缺口（{plan.next_season_prep_count}件）：
                                  </div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {plan.next_season_gaps.map((g, idx) => (
                                      <Tag key={idx} color="purple" style={{ margin: 0 }}>
                                        {g.category} 缺{g.gap}件
                                      </Tag>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            </Row>
          )}
        </>
      )}
    </BabySelector>
  )
}
