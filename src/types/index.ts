// ─── Shared TypeScript types ────────────────────────────────────────────────

export interface ShopSettings {
  id: string
  user_id: string
  shop_name: string
  contact: string
  currency_code: string
  decimal_places: 0 | 2
  last_sale_number: number
  setup_complete: boolean
}

export interface Product {
  id: string           // client-generated UUID
  user_id: string
  name: string
  price_int: number    // smallest currency unit
  threshold: number    // low-stock threshold
  stock: number
  archived: boolean
  created_at: string
  updated_at: string
}

export interface Sale {
  id: string           // client-generated UUID
  user_id: string
  sale_number: number
  customer_name?: string
  total_int: number
  completed_at: string
}

export interface SaleItem {
  id: string           // client-generated UUID
  user_id: string
  sale_id: string
  product_id: string
  product_name_snapshot: string  // name at time of sale
  unit_price_int_snapshot: number // price at time of sale
  quantity: number
  line_total_int: number
}

export type StockMovementType = 'initial' | 'restock' | 'adjustment'

export interface StockMovement {
  id: string           // client-generated UUID
  user_id: string
  product_id: string
  type: StockMovementType
  quantity: number     // positive = in, negative = adjustment
  purchase_price_int?: number
  reason?: string
  created_at: string
}

export interface SyncQueueItem {
  id?: number          // auto-increment
  table_name: string
  record_id: string
  operation: 'upsert'
  created_at: string
  attempts: number
}

// Completed sale data held in state for PrintReceipt after POS resets
export interface CompletedSaleData {
  sale: Sale
  items: SaleItem[]
  shopSettings: ShopSettings
}
