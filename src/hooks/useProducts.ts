import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import type { Product } from '../types'

/**
 * Returns all active (non-archived) products for the given user,
 * sorted alphabetically by name. Live — updates when Dexie changes.
 */
export function useProducts(userId?: string): Product[] {
  return useLiveQuery(
    async () => {
      if (!userId) return []
      return db.products
        .where('user_id').equals(userId)
        .filter(p => !p.archived)
        .sortBy('name')
    },
    [userId],
    []
  ) ?? []
}
