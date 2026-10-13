import Dexie, { type EntityTable } from 'dexie'
import type {
  ShopSettings,
  Product,
  Sale,
  SaleItem,
  StockMovement,
  SyncQueueItem,
} from '../types'

class StockartDB extends Dexie {
  shop_settings!: EntityTable<ShopSettings, 'id'>
  products!: EntityTable<Product, 'id'>
  sales!: EntityTable<Sale, 'id'>
  sale_items!: EntityTable<SaleItem, 'id'>
  stock_movements!: EntityTable<StockMovement, 'id'>
  sync_queue!: EntityTable<SyncQueueItem, 'id'>

  constructor() {
    super('stockart')

    this.version(1).stores({
      shop_settings: 'id, user_id',
      products: 'id, user_id, archived',
      sales: 'id, user_id, completed_at',
      sale_items: 'id, user_id, sale_id',
      stock_movements: 'id, user_id, product_id',
      sync_queue: '++id, table_name, record_id',
    })
  }
}

export const db = new StockartDB()
