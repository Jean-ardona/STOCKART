import { db } from './db'

// Pure sync logic (no React, no Supabase import) so it can be tested on its own.
// Strategy: one-way push, device -> Supabase. The sync_queue only says WHICH record
// changed; the record itself is read fresh from Dexie at push time.

/** Tables in foreign-key order: parents before children. */
export const TABLE_ORDER = ['shop_settings', 'products', 'sales', 'sale_items', 'stock_movements'] as const
export type SyncTable = (typeof TABLE_ORDER)[number]

/** Exactly the Supabase columns we send (missing optional values become null). */
const COLUMNS: Record<SyncTable, string[]> = {
  shop_settings: ['id', 'user_id', 'shop_name', 'contact', 'currency_code', 'decimal_places', 'last_sale_number', 'setup_complete'],
  products: ['id', 'user_id', 'name', 'price_int', 'threshold', 'stock', 'archived', 'created_at', 'updated_at'],
  sales: ['id', 'user_id', 'sale_number', 'customer_name', 'total_int', 'completed_at'],
  sale_items: ['id', 'user_id', 'sale_id', 'product_id', 'product_name_snapshot', 'unit_price_int_snapshot', 'quantity', 'line_total_int'],
  stock_movements: ['id', 'user_id', 'product_id', 'type', 'quantity', 'purchase_price_int', 'reason', 'created_at'],
}

/** shop_settings has a unique constraint on user_id, so it conflicts on user_id; the rest on id. */
const CONFLICT_COLUMN: Record<SyncTable, string> = {
  shop_settings: 'user_id',
  products: 'id',
  sales: 'id',
  sale_items: 'id',
  stock_movements: 'id',
}

const BATCH_SIZE = 200

export interface SyncDeps {
  isOnline: () => boolean
  hasSession: () => Promise<boolean>
  upsert: (
    table: string,
    rows: Record<string, unknown>[],
    onConflict: string
  ) => Promise<{ error: { code?: string; message: string } | null }>
}

export type PushResult = 'ok' | 'offline' | 'auth-error' | 'error'

function classify(error: { code?: string; message: string }): PushResult {
  const msg = (error.message || '').toLowerCase()
  if (error.code === 'PGRST301' || error.code === 'PGRST303' || error.code === '42501' || msg.includes('jwt')) {
    return 'auth-error'
  }
  if (msg.includes('failed to fetch') || msg.includes('network') || msg.includes('fetch failed')) {
    return 'offline'
  }
  return 'error'
}

function toRow(table: SyncTable, record: Record<string, unknown>): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  for (const col of COLUMNS[table]) row[col] = record[col] === undefined ? null : record[col]
  return row
}

export async function pushQueue(deps: SyncDeps): Promise<PushResult> {
  const queue = await db.sync_queue.toArray()
  if (queue.length === 0) return 'ok'
  if (!deps.isOnline()) return 'offline'
  if (!(await deps.hasSession())) return 'auth-error'

  // Entries for tables we do not know about would block the queue forever: drop them.
  const known = new Set<string>(TABLE_ORDER)
  const unknown = queue.filter(q => !known.has(q.table_name)).map(q => q.id!)
  if (unknown.length) await db.sync_queue.bulkDelete(unknown)

  for (const table of TABLE_ORDER) {
    const queued = queue.filter(q => q.table_name === table)
    if (queued.length === 0) continue

    const ids = [...new Set(queued.map(q => q.record_id))]
    const records = (await db.table(table).bulkGet(ids)).filter(Boolean) as Record<string, unknown>[]
    const rows = records.map(r => toRow(table, r))

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const { error } = await deps.upsert(table, rows.slice(i, i + BATCH_SIZE), CONFLICT_COLUMN[table])
      if (error) {
        console.error(`[sync] ${table} failed:`, error)
        await db.sync_queue.where('id').anyOf(queued.map(q => q.id!)).modify(q => { q.attempts += 1 })
        return classify(error)
      }
    }
    // Whole table pushed (rows deleted locally are simply dropped from the queue).
    await db.sync_queue.bulkDelete(queued.map(q => q.id!))
  }
  return 'ok'
}

/**
 * One-time safety net per user and device: queue every local record, so data that was
 * created before sync existed (sample products, shop settings...) reaches Supabase.
 * Upserts are idempotent, so queuing something twice is harmless.
 */
export async function ensureBackfill(
  userId: string,
  storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage
): Promise<void> {
  const key = `stockart:backfill:v1:${userId}`
  if (storage.getItem(key)) return

  const already = new Set((await db.sync_queue.toArray()).map(q => `${q.table_name}:${q.record_id}`))
  const now = new Date().toISOString()
  const adds: { table_name: string; record_id: string; operation: 'upsert'; created_at: string; attempts: number }[] = []

  for (const table of TABLE_ORDER) {
    const keys = await db.table(table).where('user_id').equals(userId).primaryKeys()
    for (const k of keys) {
      if (!already.has(`${table}:${k}`)) {
        adds.push({ table_name: table, record_id: String(k), operation: 'upsert', created_at: now, attempts: 0 })
      }
    }
  }
  if (adds.length) await db.sync_queue.bulkAdd(adds)
  storage.setItem(key, '1')
}
