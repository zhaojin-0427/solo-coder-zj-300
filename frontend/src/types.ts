export interface Baby {
  id: number
  name: string
  gender: 'M' | 'F' | 'U'
  birth_date: string
  note?: string
  current_age_months?: number
  created_at?: string
  updated_at?: string
}

export interface GrowthRecord {
  id: number
  baby: number
  baby_name?: string
  record_date: string
  height: number
  weight: number
  head_circumference?: number
  note?: string
  created_at?: string
}

export interface ClothingItem {
  id: number
  baby: number
  baby_name?: string
  name: string
  category: string
  category_display?: string
  size_type: string
  size_type_display?: string
  size_value: string
  size_label: string
  min_height: number
  max_height: number
  min_age_months: number
  max_age_months: number
  season: string
  season_display?: string
  condition: string
  condition_display?: string
  brand: string
  purchase_date?: string
  purchase_price?: number
  status: string
  status_display?: string
  note?: string
  image_url?: string
  fit_status?: string
  fit_reason?: string
  created_at?: string
  updated_at?: string
}

export interface TransferRecipient {
  id: number
  name: string
  relation: string
  baby_name: string
  phone: string
  address: string
  note?: string
  created_at?: string
}

export interface TransferRecord {
  id: number
  item: number
  item_name?: string
  item_size?: string
  recipient?: number | null
  recipient_name: string
  recipient_info?: TransferRecipient | null
  transfer_date: string
  note?: string
  status: string
  status_display?: string
  created_at?: string
}

export interface Statistics {
  overview: {
    total_items: number
    total_value: number
    idle_rate: number
    transfer_success_rate: number
    total_transfers: number
    completed_transfers: number
  }
  status_distribution: Record<string, number>
  category_stats: { labels: string[]; values: number[] }
  season_distribution: Record<string, number>
  size_cycle: Array<{ size: string; avg_cycle_days: number; count: number }>
  missing_categories: Array<{
    category: string
    code: string
    current_count: number
    recommended_count: number
    urgency: string
  }>
  stock_suggestions: Array<{
    type: string
    title: string
    content: string
    priority: string
  }>
  monthly_transfers: { labels: string[]; values: number[] }
}

export interface GrowthFitData {
  baby: {
    name: string
    age_months: number
    height?: number
    weight?: number
  }
  summary: {
    total: number
    too_small: number
    near_limit: number
    fits: number
    too_big: number
  }
  warnings: Array<{ level: string; text: string }>
  items: {
    too_small: ClothingItem[]
    near_limit: ClothingItem[]
    fits: ClothingItem[]
    too_big: ClothingItem[]
  }
}
