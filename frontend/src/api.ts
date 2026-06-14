import axios from 'axios'
import type {
  Baby,
  GrowthRecord,
  ClothingItem,
  TransferRecipient,
  TransferRecord,
  Statistics,
  GrowthFitData,
  SeasonPlan,
  SeasonPlanItem,
  ItemStatusAction,
  PlanItemCategory,
} from './types'

const API_BASE = '/api'

export const api = {
  // Baby
  getBabies: () => axios.get<Baby[]>(`${API_BASE}/babies/`).then(r => r.data),
  createBaby: (data: Partial<Baby>) => axios.post<Baby>(`${API_BASE}/babies/`, data).then(r => r.data),
  updateBaby: (id: number, data: Partial<Baby>) => axios.put<Baby>(`${API_BASE}/babies/${id}/`, data).then(r => r.data),
  deleteBaby: (id: number) => axios.delete(`${API_BASE}/babies/${id}/`),

  // Growth records
  getGrowthRecords: (params?: { baby?: number }) =>
    axios.get<GrowthRecord[]>(`${API_BASE}/growth-records/`, { params }).then(r => r.data),
  createGrowthRecord: (data: Partial<GrowthRecord>) =>
    axios.post<GrowthRecord>(`${API_BASE}/growth-records/`, data).then(r => r.data),
  updateGrowthRecord: (id: number, data: Partial<GrowthRecord>) =>
    axios.put<GrowthRecord>(`${API_BASE}/growth-records/${id}/`, data).then(r => r.data),
  deleteGrowthRecord: (id: number) => axios.delete(`${API_BASE}/growth-records/${id}/`),

  // Clothing items
  getClothingItems: (params?: Record<string, any>) =>
    axios.get<ClothingItem[]>(`${API_BASE}/clothing-items/`, { params }).then(r => r.data),
  createClothingItem: (data: Partial<ClothingItem>) =>
    axios.post<ClothingItem>(`${API_BASE}/clothing-items/`, data).then(r => r.data),
  updateClothingItem: (id: number, data: Partial<ClothingItem>) =>
    axios.put<ClothingItem>(`${API_BASE}/clothing-items/${id}/`, data).then(r => r.data),
  deleteClothingItem: (id: number) => axios.delete(`${API_BASE}/clothing-items/${id}/`),

  // Transfer recipients
  getTransferRecipients: () =>
    axios.get<TransferRecipient[]>(`${API_BASE}/transfer-recipients/`).then(r => r.data),
  createTransferRecipient: (data: Partial<TransferRecipient>) =>
    axios.post<TransferRecipient>(`${API_BASE}/transfer-recipients/`, data).then(r => r.data),
  updateTransferRecipient: (id: number, data: Partial<TransferRecipient>) =>
    axios.put<TransferRecipient>(`${API_BASE}/transfer-recipients/${id}/`, data).then(r => r.data),
  deleteTransferRecipient: (id: number) => axios.delete(`${API_BASE}/transfer-recipients/${id}/`),

  // Transfer records
  getTransferRecords: (params?: Record<string, any>) =>
    axios.get<TransferRecord[]>(`${API_BASE}/transfer-records/`, { params }).then(r => r.data),
  createTransferRecord: (data: Partial<TransferRecord>) =>
    axios.post<TransferRecord>(`${API_BASE}/transfer-records/`, data).then(r => r.data),
  updateTransferRecord: (id: number, data: Partial<TransferRecord>) =>
    axios.put<TransferRecord>(`${API_BASE}/transfer-records/${id}/`, data).then(r => r.data),
  deleteTransferRecord: (id: number) => axios.delete(`${API_BASE}/transfer-records/${id}/`),

  // Statistics
  getStatistics: (baby?: number) =>
    axios.get<Statistics>(`${API_BASE}/statistics/`, { params: { baby } }).then(r => r.data),

  // Growth fit analysis
  getGrowthFit: (baby: number) =>
    axios.get<GrowthFitData>(`${API_BASE}/growth-fit/`, { params: { baby } }).then(r => r.data),

  // Season plans
  getSeasonPlans: (params?: Record<string, any>) =>
    axios.get<SeasonPlan[]>(`${API_BASE}/season-plans/`, { params }).then(r => r.data),
  getSeasonPlan: (id: number) =>
    axios.get<SeasonPlan>(`${API_BASE}/season-plans/${id}/`).then(r => r.data),
  createSeasonPlan: (data: Partial<SeasonPlan>) =>
    axios.post<SeasonPlan>(`${API_BASE}/season-plans/`, data).then(r => r.data),
  updateSeasonPlan: (id: number, data: Partial<SeasonPlan>) =>
    axios.put<SeasonPlan>(`${API_BASE}/season-plans/${id}/`, data).then(r => r.data),
  deleteSeasonPlan: (id: number) =>
    axios.delete(`${API_BASE}/season-plans/${id}/`),
  regenerateSeasonPlanItems: (id: number) =>
    axios.post(`${API_BASE}/season-plans/${id}/regenerate/`).then(r => r.data),
  batchActionSeasonPlan: (id: number, itemIds: number[], action: ItemStatusAction) =>
    axios.post(`${API_BASE}/season-plans/${id}/batch-action/`, {
      item_ids: itemIds,
      action,
    }).then(r => r.data),
  changeCategorySeasonPlan: (id: number, itemIds: number[], category: PlanItemCategory) =>
    axios.post(`${API_BASE}/season-plans/${id}/change-category/`, {
      item_ids: itemIds,
      category,
    }).then(r => r.data),
  completeSeasonPlan: (id: number, note?: string) =>
    axios.post<SeasonPlan>(`${API_BASE}/season-plans/${id}/complete/`, { note }).then(r => r.data),
  getSeasonPlanRecentStats: (baby?: number) =>
    axios.get(`${API_BASE}/season-plans/recent-stats/`, { params: { baby } }).then(r => r.data),
}

export const categoryOptions = [
  { value: 'onesie', label: '连体衣' },
  { value: 'tshirt', label: 'T恤' },
  { value: 'shirt', label: '衬衫' },
  { value: 'pants', label: '裤子' },
  { value: 'shorts', label: '短裤' },
  { value: 'dress', label: '连衣裙' },
  { value: 'skirt', label: '裙子' },
  { value: 'coat', label: '外套' },
  { value: 'jacket', label: '夹克' },
  { value: 'sweater', label: '毛衣' },
  { value: 'hoodie', label: '卫衣' },
  { value: 'underwear', label: '内衣' },
  { value: 'socks', label: '袜子' },
  { value: 'shoes', label: '鞋子' },
  { value: 'hat', label: '帽子' },
  { value: 'bib', label: '围兜' },
  { value: 'blanket', label: '毯子' },
  { value: 'sleepwear', label: '睡衣' },
  { value: 'swimwear', label: '泳装' },
  { value: 'other', label: '其他' },
]

export const seasonOptions = [
  { value: 'spring', label: '春季' },
  { value: 'summer', label: '夏季' },
  { value: 'autumn', label: '秋季' },
  { value: 'winter', label: '冬季' },
  { value: 'all', label: '四季通用' },
]

export const conditionOptions = [
  { value: 'new', label: '全新' },
  { value: 'like_new', label: '9成新' },
  { value: 'good', label: '8成新' },
  { value: 'fair', label: '7成新' },
  { value: 'worn', label: '有使用痕迹' },
]

export const statusOptions = [
  { value: 'keep', label: '自留' },
  { value: 'to_give', label: '待转送' },
  { value: 'reserved', label: '已预定' },
  { value: 'given', label: '已送出' },
]

export const sizeTypeOptions = [
  { value: 'height', label: '按身高码' },
  { value: 'age', label: '按月龄码' },
  { value: 'eu', label: '欧码' },
  { value: 'us', label: '美码' },
  { value: 'cn', label: '国标码' },
]

export const genderOptions = [
  { value: 'M', label: '男宝' },
  { value: 'F', label: '女宝' },
  { value: 'U', label: '未知' },
]

export const targetSeasonOptions = [
  { value: 'spring', label: '春季' },
  { value: 'summer', label: '夏季' },
  { value: 'autumn', label: '秋季' },
  { value: 'winter', label: '冬季' },
]

export const seasonPlanStatusOptions = [
  { value: 'draft', label: '草稿' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
]

export const planItemCategoryOptions = [
  { value: 'continue_wear', label: '本季可继续穿' },
  { value: 'near_unsuitable', label: '即将不合身' },
  { value: 'suggest_transfer', label: '建议转送' },
  { value: 'next_season_prep', label: '下一季待准备' },
]

export const itemStatusActionOptions = [
  { value: 'to_give', label: '标记待转送' },
  { value: 'reserved', label: '标记已预定' },
  { value: 'keep', label: '继续自留' },
  { value: 'none', label: '无操作' },
]
