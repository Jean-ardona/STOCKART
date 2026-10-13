import { db } from './db'
import { S } from './strings'
import type { Product, StockMovement } from '../types'

// price_int in smallest unit (e.g. cents if decimal_places=2, or whole units if 0)
// Using XOF-style whole integers for demo realism (e.g. 1500 = 1,500)
// stock=0 → OUT (2 products), stock≤threshold → LOW (3 products), rest well-stocked
const SAMPLE_PRODUCTS: Omit<Product, 'id' | 'user_id' | 'created_at' | 'updated_at'>[] = [
  // Page 1 — index 0–15
  { name: S.sampleProducts[0],  price_int: 100,  threshold: 10, stock: 48,  archived: false }, // Water 500ml
  { name: S.sampleProducts[1],  price_int: 150,  threshold: 6,  stock: 36,  archived: false }, // Cola
  { name: S.sampleProducts[2],  price_int: 350,  threshold: 5,  stock: 22,  archived: false }, // OJ
  { name: S.sampleProducts[3],  price_int: 200,  threshold: 8,  stock: 30,  archived: false }, // Mineral Water
  { name: S.sampleProducts[4],  price_int: 300,  threshold: 5,  stock: 18,  archived: false }, // Apple Juice
  { name: S.sampleProducts[5],  price_int: 250,  threshold: 6,  stock: 3,   archived: false }, // LOW: Sparkling Water
  { name: S.sampleProducts[6],  price_int: 120,  threshold: 4,  stock: 15,  archived: false }, // Bread
  { name: S.sampleProducts[7],  price_int: 500,  threshold: 3,  stock: 12,  archived: false }, // Eggs
  { name: S.sampleProducts[8],  price_int: 280,  threshold: 5,  stock: 18,  archived: false }, // Milk
  { name: S.sampleProducts[9],  price_int: 450,  threshold: 3,  stock: 10,  archived: false }, // Butter
  { name: S.sampleProducts[10], price_int: 300,  threshold: 5,  stock: 25,  archived: false }, // Rice
  { name: S.sampleProducts[11], price_int: 250,  threshold: 4,  stock: 20,  archived: false }, // Sugar
  { name: S.sampleProducts[12], price_int: 400,  threshold: 3,  stock: 14,  archived: false }, // Oil
  { name: S.sampleProducts[13], price_int: 180,  threshold: 4,  stock: 2,   archived: false }, // LOW: Tomato Paste
  { name: S.sampleProducts[14], price_int: 220,  threshold: 6,  stock: 0,   archived: false }, // OUT: Sardines
  { name: S.sampleProducts[15], price_int: 130,  threshold: 5,  stock: 40,  archived: false }, // Biscuits
  // Page 2 — index 16–29
  { name: S.sampleProducts[16], price_int: 90,   threshold: 8,  stock: 35,  archived: false }, // Soap
  { name: S.sampleProducts[17], price_int: 380,  threshold: 4,  stock: 16,  archived: false }, // Shampoo
  { name: S.sampleProducts[18], price_int: 200,  threshold: 5,  stock: 22,  archived: false }, // Toothpaste
  { name: S.sampleProducts[19], price_int: 550,  threshold: 3,  stock: 11,  archived: false }, // Laundry
  { name: S.sampleProducts[20], price_int: 80,   threshold: 10, stock: 60,  archived: false }, // Noodles
  { name: S.sampleProducts[21], price_int: 320,  threshold: 4,  stock: 14,  archived: false }, // Condensed Milk
  { name: S.sampleProducts[22], price_int: 600,  threshold: 3,  stock: 8,   archived: false }, // Coffee
  { name: S.sampleProducts[23], price_int: 250,  threshold: 4,  stock: 3,   archived: false }, // LOW: Tea Bags
  { name: S.sampleProducts[24], price_int: 180,  threshold: 5,  stock: 20,  archived: false }, // Flour
  { name: S.sampleProducts[25], price_int: 60,   threshold: 6,  stock: 45,  archived: false }, // Salt
  { name: S.sampleProducts[26], price_int: 40,   threshold: 8,  stock: 30,  archived: false }, // Pepper
  { name: S.sampleProducts[27], price_int: 50,   threshold: 10, stock: 55,  archived: false }, // Matches
  { name: S.sampleProducts[28], price_int: 150,  threshold: 5,  stock: 0,   archived: false }, // OUT: Candles
  { name: S.sampleProducts[29], price_int: 500,  threshold: 3,  stock: 20,  archived: false }, // Phone Credit
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
