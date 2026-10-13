import { db } from './db'
import { S } from './strings'
import type { Product, StockMovement } from '../types'

const SAMPLE_PRODUCTS: Omit<Product, 'id' | 'user_id' | 'created_at' | 'updated_at'>[] = [
  { name: S.sampleProducts[0],  price_int: 100,  threshold: 10, stock: 48, archived: false },
  { name: S.sampleProducts[1],  price_int: 150,  threshold: 6,  stock: 36, archived: false },
  { name: S.sampleProducts[2],  price_int: 350,  threshold: 5,  stock: 20, archived: false },
  { name: S.sampleProducts[3],  price_int: 200,  threshold: 8,  stock: 30, archived: false },
  { name: S.sampleProducts[4],  price_int: 120,  threshold: 4,  stock: 15, archived: false },
  { name: S.sampleProducts[5],  price_int: 500,  threshold: 3,  stock: 12, archived: false },
  { name: S.sampleProducts[6],  price_int: 280,  threshold: 5,  stock: 18, archived: false },
  { name: S.sampleProducts[7],  price_int: 450,  threshold: 3,  stock: 10, archived: false },
  { name: S.sampleProducts[8],  price_int: 300,  threshold: 5,  stock: 25, archived: false },
  { name: S.sampleProducts[9],  price_int: 250,  threshold: 4,  stock: 20, archived: false },
  { name: S.sampleProducts[10], price_int: 400,  threshold: 3,  stock: 14, archived: false },
  { name: S.sampleProducts[11], price_int: 180,  threshold: 4,  stock: 22, archived: false },
  { name: S.sampleProducts[12], price_int: 220,  threshold: 6,  stock: 30, archived: false },
  { name: S.sampleProducts[13], price_int: 130,  threshold: 5,  stock: 40, archived: false },
  { name: S.sampleProducts[14], price_int: 90,   threshold: 8,  stock: 35, archived: false },
]

/**
 * Seed ~15 sample products after the user's first login.
 * Only runs if no products exist yet for this user.
 */
export async function seedSampleProducts(userId: string): Promise<void> {
  const existing = await db.products.where('user_id').equals(userId).count()
  if (existing > 0) return

  const now = new Date().toISOString()

  await db.transaction('rw', db.products, db.stock_movements, db.sync_queue, async () => {
    for (const template of SAMPLE_PRODUCTS) {
      const productId = crypto.randomUUID()
      const product: Product = {
        id: productId,
        user_id: userId,
        ...template,
        created_at: now,
        updated_at: now,
      }
      await db.products.add(product)

      // Create 'initial' stock movement
      const movement: StockMovement = {
        id: crypto.randomUUID(),
        user_id: userId,
        product_id: productId,
        type: 'initial',
        quantity: template.stock,
        created_at: now,
      }
      await db.stock_movements.add(movement)

      // Add both to sync queue
      await db.sync_queue.add({
        table_name: 'products',
        record_id: productId,
        operation: 'upsert',
        created_at: now,
        attempts: 0,
      })
      await db.sync_queue.add({
        table_name: 'stock_movements',
        record_id: movement.id,
        operation: 'upsert',
        created_at: now,
        attempts: 0,
      })
    }
  })
}
