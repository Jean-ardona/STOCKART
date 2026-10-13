import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import type { ShopSettings } from '../types'

/**
 * Returns the first shop_settings row for the current user,
 * or undefined while loading / not set up yet.
 */
export function useShopSettings(userId?: string): ShopSettings | undefined {
  return useLiveQuery(
    async () => {
      if (!userId) return undefined
      const rows = await db.shop_settings.where('user_id').equals(userId).toArray()
      return rows[0]
    },
    [userId]
  )
}
