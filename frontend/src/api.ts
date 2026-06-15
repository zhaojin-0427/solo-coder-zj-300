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
  BorrowObject,
  BorrowRecord,
  BorrowRecordSummary,
  BorrowStatistics,
  StorageLocation,
  CareRecord,
  CareStatus,
  WashMethod,
  SterilizeMethod,
  DryMethod,
  CareType,
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

  // Borrow objects
  getBorrowObjects: () =>
    axios.get<BorrowObject[]>(`${API_BASE}/borrow-objects/`).then(r => r.data),
  createBorrowObject: (data: Partial<BorrowObject>) =>
    axios.post<BorrowObject>(`${API_BASE}/borrow-objects/`, data).then(r => r.data),
  updateBorrowObject: (id: number, data: Partial<BorrowObject>) =>
    axios.put<BorrowObject>(`${API_BASE}/borrow-objects/${id}/`, data).then(r => r.data),
  deleteBorrowObject: (id: number) =>
    axios.delete(`${API_BASE}/borrow-objects/${id}/`),

  // Borrow records
  getBorrowRecords: (params?: Record<string, any>) =>
    axios.get<BorrowRecord[]>(`${API_BASE}/borrow-records/`, { params }).then(r => r.data),
  createBorrowRecord: (data: Partial<BorrowRecord>) =>
    axios.post<BorrowRecord>(`${API_BASE}/borrow-records/`, data).then(r => r.data),
  updateBorrowRecord: (id: number, data: Partial<BorrowRecord>) =>
    axios.put<BorrowRecord>(`${API_BASE}/borrow-records/${id}/`, data).then(r => r.data),
  deleteBorrowRecord: (id: number) =>
    axios.delete(`${API_BASE}/borrow-records/${id}/`),
  getOverdueBorrowRecords: (baby?: number) =>
    axios.get<{ count: number; records: BorrowRecordSummary[] }>(`${API_BASE}/borrow-records/overdue/`, { params: { baby } }).then(r => r.data),
  getActiveBorrowRecords: (baby?: number) =>
    axios.get<{ count: number; records: BorrowRecordSummary[] }>(`${API_BASE}/borrow-records/active/`, { params: { baby } }).then(r => r.data),
  returnBorrowRecord: (id: number, data: any) =>
    axios.post<{ message: string; record: BorrowRecordSummary; suggest_transfer: boolean }>(`${API_BASE}/borrow-records/${id}/return/`, data).then(r => r.data),
  getBorrowStatistics: (baby?: number) =>
    axios.get<BorrowStatistics>(`${API_BASE}/borrow-records/statistics/`, { params: { baby } }).then(r => r.data),

  // Storage locations
  getStorageLocations: (params?: Record<string, any>) =>
    axios.get<StorageLocation[]>(`${API_BASE}/storage-locations/`, { params }).then(r => r.data),
  getStorageLocationsWithItems: (baby?: number) =>
    axios.get<{ count: number; locations: StorageLocation[] }>(`${API_BASE}/storage-locations/with-items/`, { params: { baby } }).then(r => r.data),
  createStorageLocation: (data: Partial<StorageLocation>) =>
    axios.post<StorageLocation>(`${API_BASE}/storage-locations/`, data).then(r => r.data),
  updateStorageLocation: (id: number, data: Partial<StorageLocation>) =>
    axios.put<StorageLocation>(`${API_BASE}/storage-locations/${id}/`, data).then(r => r.data),
  deleteStorageLocation: (id: number) =>
    axios.delete(`${API_BASE}/storage-locations/${id}/`),

  // Care records
  getCareRecords: (params?: Record<string, any>) =>
    axios.get<CareRecord[]>(`${API_BASE}/care-records/`, { params }).then(r => r.data),
  createCareRecord: (data: Partial<CareRecord>) =>
    axios.post<CareRecord>(`${API_BASE}/care-records/`, data).then(r => r.data),
  updateCareRecord: (id: number, data: Partial<CareRecord>) =>
    axios.put<CareRecord>(`${API_BASE}/care-records/${id}/`, data).then(r => r.data),
  deleteCareRecord: (id: number) =>
    axios.delete(`${API_BASE}/care-records/${id}/`),

  // Clothing item care actions
  getClothingCareSummary: (baby?: number) =>
    axios.get(`${API_BASE}/clothing-items/care-summary/`, { params: { baby } }).then(r => r.data),
  getClothingPendingList: (baby?: number, careStatus?: CareStatus) =>
    axios.get<{ count: number; items: ClothingItem[] }>(`${API_BASE}/clothing-items/pending-list/`, { params: { baby, care_status: careStatus } }).then(r => r.data),
  batchUpdateCareStatus: (itemIds: number[], careStatus: CareStatus) =>
    axios.post<{ message: string; updated_count: number; skipped_lent_count: number }>(
      `${API_BASE}/clothing-items/batch-care-status/`,
      { item_ids: itemIds, care_status: careStatus }
    ).then(r => r.data),
  batchWashClothing: (data: {
    item_ids: number[]
    wash_method?: WashMethod
    sterilize_method?: SterilizeMethod
    dry_method?: DryMethod
    care_date?: string
    detergent_used?: string
    water_temperature?: string
    care_note?: string
    operator?: string
  }) =>
    axios.post<{ message: string; updated_count: number }>(`${API_BASE}/clothing-items/batch-wash/`, data).then(r => r.data),
  batchStoreClothing: (data: {
    item_ids: number[]
    storage_location: number
    care_date?: string
    care_note?: string
    operator?: string
  }) =>
    axios.post<{ message: string; updated_count: number; storage_location: StorageLocation }>(
      `${API_BASE}/clothing-items/batch-store/`,
      data
    ).then(r => r.data),
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

export const statusOptionsWithLent = [
  { value: 'keep', label: '自留' },
  { value: 'to_give', label: '待转送' },
  { value: 'reserved', label: '已预定' },
  { value: 'given', label: '已送出' },
  { value: 'lent', label: '借出中' },
]

export const relationOptions = [
  { value: 'family', label: '家人' },
  { value: 'relative', label: '亲戚' },
  { value: 'friend', label: '朋友' },
  { value: 'neighbor', label: '邻居' },
  { value: 'colleague', label: '同事' },
  { value: 'other', label: '其他' },
]

export const borrowStatusOptions = [
  { value: 'borrowed', label: '借出中' },
  { value: 'overdue', label: '逾期未还' },
  { value: 'returned', label: '已归还' },
  { value: 'returned_damaged', label: '归还有损坏' },
]

export const borrowStatusGroupOptions = [
  { value: 'all', label: '全部' },
  { value: 'active', label: '借出中/逾期' },
  { value: 'returned', label: '已归还' },
]

export const washStatusOptions = [
  { value: 'unwashed', label: '未清洗' },
  { value: 'washed', label: '已清洗' },
  { value: 'to_wash', label: '需清洗后归还' },
]

export const conditionChangeOptions = [
  { value: 'same', label: '无变化' },
  { value: 'slight', label: '轻微变旧' },
  { value: 'noticeable', label: '明显变旧' },
  { value: 'damaged', label: '有损坏' },
]

export const planItemCategoryOptionsWithLent = [
  { value: 'continue_wear', label: '本季可继续穿' },
  { value: 'near_unsuitable', label: '即将不合身' },
  { value: 'suggest_transfer', label: '建议转送' },
  { value: 'next_season_prep', label: '下一季待准备' },
  { value: 'lent', label: '暂不可整理(借出中)' },
]

export const careStatusOptions = [
  { value: 'to_wash', label: '待清洗' },
  { value: 'washing', label: '清洗中' },
  { value: 'to_dry', label: '待晾晒' },
  { value: 'drying', label: '晾晒中' },
  { value: 'to_sterilize', label: '需消毒' },
  { value: 'sterilizing', label: '消毒中' },
  { value: 'to_store', label: '待入柜' },
  { value: 'stored', label: '已入柜' },
  { value: 'in_use', label: '穿着中' },
]

export const careStatusBatchOptions = [
  { value: 'to_wash', label: '标记待清洗' },
  { value: 'washing', label: '标记清洗中' },
  { value: 'to_dry', label: '标记待晾晒' },
  { value: 'drying', label: '标记晾晒中' },
  { value: 'to_sterilize', label: '标记需消毒' },
  { value: 'sterilizing', label: '标记消毒中' },
  { value: 'to_store', label: '标记待入柜' },
  { value: 'stored', label: '标记已入柜' },
  { value: 'in_use', label: '标记取出使用' },
]

export const washMethodOptions = [
  { value: 'hand', label: '手洗' },
  { value: 'machine_normal', label: '机洗普通' },
  { value: 'machine_gentle', label: '机洗轻柔' },
  { value: 'dry_clean', label: '干洗' },
  { value: 'wipe', label: '擦拭清洁' },
]

export const sterilizeMethodOptions = [
  { value: 'none', label: '无需消毒' },
  { value: 'sunlight', label: '阳光暴晒' },
  { value: 'steam', label: '蒸汽消毒' },
  { value: 'uv', label: '紫外线消毒' },
  { value: 'boil', label: '煮沸消毒' },
  { value: 'disinfectant', label: '消毒液浸泡' },
]

export const dryMethodOptions = [
  { value: 'natural_shade', label: '阴干' },
  { value: 'natural_sun', label: '日晒' },
  { value: 'dryer_low', label: '烘干机低温' },
  { value: 'dryer_normal', label: '烘干机常温' },
  { value: 'flat_dry', label: '平铺晾晒' },
]

export const locationTypeOptions = [
  { value: 'wardrobe', label: '衣柜' },
  { value: 'drawer', label: '抽屉' },
  { value: 'shelf', label: '架子' },
  { value: 'box', label: '收纳箱' },
  { value: 'hanger', label: '挂架' },
  { value: 'basket', label: '收纳篮' },
  { value: 'bag', label: '收纳袋' },
  { value: 'other', label: '其他' },
]

export const careTypeOptions = [
  { value: 'wash', label: '清洗' },
  { value: 'dry', label: '晾晒' },
  { value: 'sterilize', label: '消毒' },
  { value: 'store', label: '入柜' },
  { value: 'retrieve', label: '取出使用' },
  { value: 'other', label: '其他护理' },
]

export const careStatusTagColors: Record<string, string> = {
  to_wash: 'volcano',
  washing: 'orange',
  to_dry: 'gold',
  drying: 'lime',
  to_sterilize: 'magenta',
  sterilizing: 'purple',
  to_store: 'geekblue',
  stored: 'green',
  in_use: 'cyan',
}
