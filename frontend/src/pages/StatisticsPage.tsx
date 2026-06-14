import { useState, useEffect } from 'react'
import BabySelector from '../components/BabySelector'
import { useBaby } from '../App'
import { App as AntdApp, Card, Row, Col, Statistic, Tag, Progress, List, Alert, Empty } from 'antd'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line
} from 'recharts'
import {
  WarningOutlined, BulbOutlined, FireOutlined, CheckCircleOutlined,
  UnorderedListOutlined, CalendarOutlined
} from '@ant-design/icons'
import { api } from '../api'
import type { Statistics } from '../types'

const STATUS_COLORS: Record<string, string> = {
  '自留': '#1677ff',
  '待转送': '#fa8c16',
  '已预定': '#722ed1',
  '已送出': '#52c41a',
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
    </BabySelector>
  )
}
