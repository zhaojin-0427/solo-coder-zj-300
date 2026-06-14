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

export type SeasonPlanStatus = 'draft' | 'in_progress' | 'completed'
export type TargetSeason = 'spring' | 'summer' | 'autumn' | 'winter'
export type PlanItemCategory =
  | 'continue_wear'
  | 'near_unsuitable'
  | 'suggest_transfer'
  | 'next_season_prep'
export type ItemStatusAction = 'to_give' | 'reserved' | 'keep' | 'none'

export interface SeasonPlanItem {
  id: number
  plan: number
  item: number | null
  auto_category: PlanItemCategory
  auto_category_display?: string
  user_category?: PlanItemCategory | null
  effective_category: PlanItemCategory
  effective_category_display?: string
  item_status_action: ItemStatusAction
  item_status_action_display?: string
  item_name: string
  item_category: string
  item_size_label: string
  item_season: string
  item_condition: string
  note?: string
  item_info?: ClothingItem | null
  created_at?: string
  updated_at?: string
}

export interface SeasonPlanStats {
  continue_wear: number
  near_unsuitable: number
  suggest_transfer: number
  next_season_prep: number
  action_to_give: number
  action_reserved: number
  action_keep: number
  action_none: number
}

export interface SeasonPlan {
  id: number
  baby: number
  baby_name?: string
  name: string
  target_season: TargetSeason
  target_season_display?: string
  plan_date: string
  completed_date?: string | null
  status: SeasonPlanStatus
  status_display?: string
  note?: string
  plan_items?: SeasonPlanItem[]
  stats?: SeasonPlanStats
  created_at?: string
  updated_at?: string
}

export interface SeasonPlanGap {
  category: string
  code: string
  current_count?: number
  recommended_count?: number
  gap?: number
  total_gap?: number
}

export interface SeasonPlanRecentStat {
  plan_id: number
  plan_name: string
  target_season: TargetSeason
  target_season_display: string
  status: SeasonPlanStatus
  status_display: string
  plan_date: string
  completed_date?: string | null
  total_items: number
  suggest_transfer_count: number
  actual_transfer_count: number
  transfer_conversion_rate: number
  completion_rate: number
  next_season_prep_count: number
  next_season_gaps: SeasonPlanGap[]
}

export interface SeasonPlanStatistics {
  recent_plans: SeasonPlanRecentStat[]
  avg_completion_rate: number
  total_transfer_converted: number
  next_season_gap_summary: SeasonPlanGap[]
}

export interface Statistics {
  overview: {
    total_items: number
    total_value: number
    idle_rate: number
    transfer_success_rate: number
    total_transfers: number
    completed_transfers: number
    given_item_count: number
    given_item_rate: number
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
  season_plan_stats?: SeasonPlanStatistics
}
