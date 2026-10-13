import { db } from './db'
import type { CartLine } from '../hooks/useSaleCart'
import type { Sale, SaleItem, CompletedSaleData } from '../types'

/**
 * Atomically completes a sale in Dexie:
 * 1. Writes a sales row
 * 2. Writes N sale_items rows (with price snapshots)
 * 3. Decrements products.stock for each sold product
 * 4. Adds sale, sale_items, and affected products to sync_queue
 * 5. Increments shop_settings.last_sale_number
 *
 * Returns the completed sale data for PrintReceipt.
 */
export async function completeSale(
  userId: string,
  lines: CartLine[],
  customerName: string
): Promise<CompletedSaleData> {
  if (lines.length === 0) throw new Error('Cart is empty')

  const now = new Date().toISOString()
  const saleId = crypto.randomUUID()

  const shopSettings = await db.shop_settings.where('user_id').equals(userId).first()
  if (!shopSettings) throw new Error('Shop settings not found')

  const newSaleNumber = shopSettings.last_sale_number + 1
  const totalInt = lines.reduce((sum, l) => sum + l.unitPriceInt * l.quantity, 0)

  const sale: Sale = {
    id: saleId,
    user_id: userId,
    sale_number: newSaleNumber,
    customer_name: customerName.trim() || undefined,
    total_int: totalInt,
    completed_at: now,
  }

  const saleItems: SaleItem[] = lines.map(line => ({
    id: crypto.randomUUID(),
    user_id: userId,
    sale_id: saleId,
    product_id: line.productId,
    product_name_snapshot: line.productName,
    unit_price_int_snapshot: line.unitPriceInt,
    quantity: line.quantity,
    line_total_int: line.unitPriceInt * line.quantity,
  }))

  await db.transaction(
    'rw',
    db.sales, db.sale_items, db.products, db.shop_settings, db.sync_queue,
    async () => {
      // Write sale + items
      await db.sales.add(sale)
      await db.sale_items.bulkAdd(saleItems)

      // Decrement stock for each product
      for (const line of lines) {
        const product = await db.products.get(line.productId)
        if (!product) continue
        const newStock = Math.max(0, product.stock - line.quantity)
        await db.products.update(line.productId, {
          stock: newStock,
          updated_at: now,
        })
      }

      // Increment sale number
      await db.shop_settings.update(shopSettings.id, {
        last_sale_number: newSaleNumber,
      })

      // Add to sync queue: sale, all sale_items, all affected products, shop_settings
      await db.sync_queue.add({ table_name: 'sales', record_id: saleId, operation: 'upsert', created_at: now, attempts: 0 })

      for (const item of saleItems) {
        await db.sync_queue.add({ table_name: 'sale_items', record_id: item.id, operation: 'upsert', created_at: now, attempts: 0 })
      }

      for (const line of lines) {
        await db.sync_queue.add({ table_name: 'products', record_id: line.productId, operation: 'upsert', created_at: now, attempts: 0 })
      }

      await db.sync_queue.add({ table_name: 'shop_settings', record_id: shopSettings.id, operation: 'upsert', created_at: now, attempts: 0 })
    }
  )

  // Return completed sale data for PrintReceipt (read fresh shop settings)
  const updatedSettings = await db.shop_settings.get(shopSettings.id)
  return {
    sale,
    items: saleItems,
    shopSettings: updatedSettings ?? shopSettings,
  }
}
