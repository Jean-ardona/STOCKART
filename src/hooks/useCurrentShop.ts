import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import type { ShopSettings } from '../types'

/** The shop_settings row of this device (undefined while loading). */
export function useCurrentShop(): ShopSettings | undefined {
  return useLiveQuery(() => db.shop_settings.toCollection().first(), [])
}
