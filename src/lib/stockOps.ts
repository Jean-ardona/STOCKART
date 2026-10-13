import { db } from './db'
import type { Product, StockMovement, StockMovementType } from '../types'

// Every stock change goes through these functions: one Dexie transaction,
// the product row, an optional stock_movements row, and sync_queue entries.

type Table = 'products' | 'stock_movements'

async function enqueue(table: Table, recordId: string, now: string) {
  await db.sync_queue.add({
    table_name: table,
    record_id: recordId,
    operation: 'upsert',
    created_at: now,
    attempts: 0,
  })
}

async function addMovement(
  userId: string,
  productId: string,
  type: StockMovementType,
  quantity: number,
  now: string,
  extra: { purchase_price_int?: number; reason?: string } = {}
) {
  const movement: StockMovement = {
    id: crypto.randomUUID(),
    user_id: userId,
    product_id: productId,
    type,
    quantity,
    created_at: now,
    ...extra,
  }
  await db.stock_movements.add(movement)
  await enqueue('stock_movements', movement.id, now)
}

export interface NewProductInput {
  name: string
  priceInt: number
  threshold: number
  initialQty: number
}

export async function addProduct(userId: string, input: NewProductInput): Promise<void> {
  const now = new Date().toISOString()
  const product: Product = {
    id: crypto.randomUUID(),
    user_id: userId,
    name: input.name.trim(),
    price_int: input.priceInt,
    threshold: input.threshold,
    stock: input.initialQty,
    archived: false,
    created_at: now,
    updated_at: now,
  }
  await db.transaction('rw', db.products, db.stock_movements, db.sync_queue, async () => {
    await db.products.add(product)
    await enqueue('products', product.id, now)
    if (input.initialQty > 0) {
      await addMovement(userId, product.id, 'initial', input.initialQty, now)
    }
  })
}

export async function editProduct(
  productId: string,
  input: { name: string; priceInt: number; threshold: number }
): Promise<void> {
  const now = new Date().toISOString()
  await db.transaction('rw', db.products, db.sync_queue, async () => {
    await db.products.update(productId, {
      name: input.name.trim(),
      price_int: input.priceInt,
      threshold: input.threshold,
      updated_at: now,
    })
    await enqueue('products', productId, now)
  })
}

export async function archiveProduct(productId: string): Promise<void> {
  const now = new Date().toISOString()
  await db.transaction('rw', db.products, db.sync_queue, async () => {
    await db.products.update(productId, { archived: true, updated_at: now })
    await enqueue('products', productId, now)
  })
}

export async function restockProduct(
  userId: string,
  productId: string,
  quantity: number,
  purchasePriceInt?: number
): Promise<void> {
  if (!Number.isInteger(quantity) || quantity <= 0) throw new Error('Quantity must be a positive whole number')
  const now = new Date().toISOString()
  await db.transaction('rw', db.products, db.stock_movements, db.sync_queue, async () => {
    const product = await db.products.get(productId)
    if (!product) throw new Error('Product not found')
    await db.products.update(productId, { stock: product.stock + quantity, updated_at: now })
    await enqueue('products', productId, now)
    await addMovement(userId, productId, 'restock', quantity, now,
      purchasePriceInt !== undefined ? { purchase_price_int: purchasePriceInt } : {})
  })
}

export async function adjustProduct(
  userId: string,
  productId: string,
  quantity: number,
  reason: string
): Promise<void> {
  if (!Number.isInteger(quantity) || quantity === 0) throw new Error('Adjustment must be a non-zero whole number')
  if (!reason.trim()) throw new Error('A reason is required')
  const now = new Date().toISOString()
  await db.transaction('rw', db.products, db.stock_movements, db.sync_queue, async () => {
    const product = await db.products.get(productId)
    if (!product) throw new Error('Product not found')
    if (product.stock + quantity < 0) throw new Error('Stock cannot go below zero')
    await db.products.update(productId, { stock: product.stock + quantity, updated_at: now })
    await enqueue('products', productId, now)
    await addMovement(userId, productId, 'adjustment', quantity, now, { reason: reason.trim() })
  })
}
