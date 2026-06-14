import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { Layout, Menu, App as AntdApp } from 'antd'
import {
  HddOutlined,
  ArrowsAltOutlined,
  GiftOutlined,
  RiseOutlined,
  BarChartOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import type { Baby } from './types'
import { api } from './api'
import ClothingPage from './pages/ClothingPage'
import SizeTrackingPage from './pages/SizeTrackingPage'
import TransferPage from './pages/TransferPage'
import GrowthFitPage from './pages/GrowthFitPage'
import StatisticsPage from './pages/StatisticsPage'
import SeasonPlanPage from './pages/SeasonPlanPage'

const { Sider, Content, Header } = Layout

interface BabyContextType {
  babies: Baby[]
  selectedBaby: Baby | null
  setSelectedBaby: (b: Baby | null) => void
  refreshBabies: () => void
}

export const BabyContext = createContext<BabyContextType>({
  babies: [],
  selectedBaby: null,
  setSelectedBaby: () => {},
  refreshBabies: () => {},
})

export const useBaby = () => useContext(BabyContext)

export default function App() {
  const [babies, setBabies] = useState<Baby[]>([])
  const [selectedBaby, setSelectedBaby] = useState<Baby | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const antdApp = AntdApp.useApp()

  const refreshBabies = async () => {
    try {
      const list = await api.getBabies()
      setBabies(list)
      if (list.length > 0 && !selectedBaby) {
        setSelectedBaby(list[0])
      }
    } catch (e: any) {
      antdApp.message.error('加载宝宝列表失败')
    }
  }

  useEffect(() => {
    refreshBabies()
  }, [])

  const menuItems = [
    { key: '/clothing', icon: <HddOutlined />, label: '物品档案' },
    { key: '/size-tracking', icon: <ArrowsAltOutlined />, label: '尺码追踪' },
    { key: '/season-plan', icon: <CalendarOutlined />, label: '换季计划' },
    { key: '/transfer', icon: <GiftOutlined />, label: '转送记录' },
    { key: '/growth-fit', icon: <RiseOutlined />, label: '成长适配' },
    { key: '/statistics', icon: <BarChartOutlined />, label: '统计' },
  ]

  const selectedKey = location.pathname === '/' ? '/clothing' : location.pathname

  return (
    <BabyContext.Provider value={{ babies, selectedBaby, setSelectedBaby, refreshBabies }}>
      <Layout className="app-container">
        <Sider width={220} className="app-sider" theme="light">
          <div className="logo">
            <span className="logo-emoji">👶</span>
            宝宝衣橱管家
          </div>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            onClick={(e) => navigate(e.key)}
            style={{ borderRight: 'none', background: 'transparent' }}
            items={menuItems}
          />
        </Sider>
        <Layout style={{ background: 'transparent' }}>
          <Content className="app-content">
            <Routes>
              <Route path="/" element={<Navigate to="/clothing" replace />} />
              <Route path="/clothing" element={<ClothingPage />} />
              <Route path="/size-tracking" element={<SizeTrackingPage />} />
              <Route path="/season-plan" element={<SeasonPlanPage />} />
              <Route path="/transfer" element={<TransferPage />} />
              <Route path="/growth-fit" element={<GrowthFitPage />} />
              <Route path="/statistics" element={<StatisticsPage />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </BabyContext.Provider>
  )
}
