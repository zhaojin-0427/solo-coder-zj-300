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

export type CareStatus =
  | 'to_wash'
  | 'washing'
  | 'to_dry'
  | 'drying'
  | 'to_sterilize'
  | 'sterilizing'
  | 'to_store'
  | 'stored'
  | 'in_use'

export type WashMethod = 'hand' | 'machine_normal' | 'machine_gentle' | 'dry_clean' | 'wipe'
export type SterilizeMethod = 'none' | 'sunlight' | 'steam' | 'uv' | 'boil' | 'disinfectant'
export type DryMethod = 'natural_shade' | 'natural_sun' | 'dryer_low' | 'dryer_normal' | 'flat_dry'
export type LocationType = 'wardrobe' | 'drawer' | 'shelf' | 'box' | 'hanger' | 'basket' | 'bag' | 'other'
export type CareType = 'wash' | 'dry' | 'sterilize' | 'store' | 'retrieve' | 'other'

export interface StorageLocation {
  id: number
  baby: number
  baby_name?: string
  name: string
  location_type: LocationType
  location_type_display?: string
  container_name?: string
  area?: string
  shelf_level?: string
  sort_order?: number
  note?: string
  stored_item_count?: number
  stored_items?: ClothingItem[]
  created_at?: string
  updated_at?: string
}

export interface CareRecord {
  id: number
  item: number
  item_name?: string
  item_size_label?: string
  care_type: CareType
  care_type_display?: string
  care_date: string
  care_time?: string
  wash_method?: WashMethod | null
  wash_method_display?: string
  dry_method?: DryMethod | null
  dry_method_display?: string
  sterilize_method?: SterilizeMethod | null
  sterilize_method_display?: string
  storage_location?: number | null
  storage_location_info?: StorageLocation | null
  detergent_used?: string
  water_temperature?: string
  duration_minutes?: number | null
  care_note?: string
  operator?: string
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
  care_status: CareStatus
  care_status_display?: string
  storage_location?: number | null
  storage_location_info?: StorageLocation | null
  last_wash_date?: string | null
  last_store_date?: string | null
  wash_count?: number
  preferred_wash_method?: WashMethod
  preferred_wash_method_display?: string
  preferred_sterilize_method?: SterilizeMethod
  preferred_sterilize_method_display?: string
  preferred_dry_method?: DryMethod
  preferred_dry_method_display?: string
  care_note?: string
  note?: string
  image_url?: string
  fit_status?: string
  fit_reason?: string
  is_borrowed?: boolean
  is_lent?: boolean
  current_borrow?: BorrowRecordSummary | null
  recent_care_records?: CareRecord[]
  days_since_last_wash?: number | null
  days_since_last_store?: number | null
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
    lent: number
  }
  warnings: Array<{ level: string; text: string }>
  items: {
    too_small: ClothingItem[]
    near_limit: ClothingItem[]
    fits: ClothingItem[]
    too_big: ClothingItem[]
    lent: ClothingItem[]
  }
}

export type SeasonPlanStatus = 'draft' | 'in_progress' | 'completed'
export type TargetSeason = 'spring' | 'summer' | 'autumn' | 'winter'
export type PlanItemCategory =
  | 'continue_wear'
  | 'near_unsuitable'
  | 'suggest_transfer'
  | 'next_season_prep'
  | 'lent'
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
  item_care_status?: string | null
  item_care_status_display?: string | null
  item_storage_location_info?: { id: number; name: string } | null
  item_info?: ClothingItem | null
  item_current_borrow?: BorrowRecordSummary | null
  created_at?: string
  updated_at?: string
}

export interface SeasonPlanStats {
  continue_wear: number
  near_unsuitable: number
  suggest_transfer: number
  next_season_prep: number
  lent: number
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

export interface BorrowObject {
  id: number
  name: string
  relation: string
  relation_display?: string
  baby_name: string
  baby_gender: 'M' | 'F' | 'U'
  baby_gender_display?: string
  baby_birth_date?: string
  phone: string
  address: string
  note?: string
  borrow_count?: number
  current_borrow_count?: number
  created_at?: string
  updated_at?: string
}

export interface BorrowRecordSummary {
  id: number
  item: number
  item_name?: string
  item_category?: string
  item_size_label?: string
  borrower?: number | null
  borrower_name: string
  baby_name: string
  borrower_info?: BorrowObject | null
  borrow_date: string
  expected_return_date?: string | null
  actual_return_date?: string | null
  status: string
  status_display?: string
  original_condition: string
  original_condition_display?: string
  return_condition?: string | null
  return_condition_display?: string | null
  condition_change?: string | null
  condition_change_display?: string | null
  wash_status: string
  wash_status_display?: string
  item_care_status?: string | null
  item_care_status_display?: string | null
  note?: string
  return_note?: string
  suggest_transfer?: boolean
  is_overdue?: boolean
  days_borrowed?: number
  days_overdue?: number
  created_at?: string
  updated_at?: string
}

export interface BorrowRecord extends BorrowRecordSummary {}

export interface BorrowStatistics {
  recent_30d_borrow_count: number
  on_time_return_rate: number
  overdue_count: number
  condition_decline_count: number
  most_borrowed_categories: Array<{
    category: string
    code: string
    count: number
  }>
  most_active_borrowers?: Array<{
    name: string
    count: number
  }>
  recent_30days?: {
    borrowed_count: number
    returned_count: number
    on_time_return_rate: number
    overdue_count: number
    condition_decline_count: number
  }
  overall?: {
    total_borrow_count: number
    total_returned: number
    total_borrowed_value: number
  }
  current_lent_count?: number
  current_lent_rate?: number
}

export interface CareStatistics {
  recent_30d_wash_count: number
  to_wash_count: number
  washing_count: number
  to_dry_count: number
  drying_count: number
  to_sterilize_count: number
  sterilizing_count: number
  to_store_count: number
  stored_count: number
  in_use_count: number
  pending_total: number
  care_status_distribution: Record<string, number>
  sterilize_coverage_30d: number
  most_used_locations: Array<{
    id: number
    name: string
    location_type: LocationType
    location_type_display: string
    container_name: string
    area: string
    stored_count: number
  }>
  long_not_stored_count: number
  long_not_stored_items: ClothingItem[]
  wash_method_distribution: Record<string, number>
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
    lent_item_count: number
    lent_item_rate: number
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
  borrow_stats?: BorrowStatistics
  care_stats?: CareStatistics
}
