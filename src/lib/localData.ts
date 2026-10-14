import { db } from './db'

type KeyStorage = Pick<Storage, 'length' | 'key' | 'removeItem'>

/**
 * The local database is shared by every account that signs in on this browser.
 * Call this right after a successful sign-in:
 *  - 'ok'      : nothing from another account on this device
 *  - 'cleared' : another account's (already synced) data was removed
 *  - 'blocked' : another account still has unsynced changes; do NOT delete them
 */
export async function prepareDeviceForUser(
  userId: string,
  storage: KeyStorage = localStorage
): Promise<'ok' | 'cleared' | 'blocked'> {
  const foreign = await db.shop_settings.filter(s => s.user_id !== userId).count()
  if (foreign === 0) return 'ok'
  if ((await db.sync_queue.count()) > 0) return 'blocked'

  await db.transaction(
    'rw',
    [db.shop_settings, db.products, db.sales, db.sale_items, db.stock_movements, db.sync_queue],
    async () => {
      await Promise.all([
        db.shop_settings.clear(), db.products.clear(), db.sales.clear(),
        db.sale_items.clear(), db.stock_movements.clear(), db.sync_queue.clear(),
      ])
    }
  )

  const keys: string[] = []
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i)
    if (k && k.startsWith('stockart:')) keys.push(k)
  }
  keys.forEach(k => storage.removeItem(k))
  return 'cleared'
}
