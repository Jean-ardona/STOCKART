import { liveQuery } from 'dexie'
import { db } from './db'
import { supabase } from './supabase'
import { pushQueue, ensureBackfill, type SyncDeps } from './syncCore'

export type SyncStatus = 'synced' | 'pending' | 'offline' | 'auth-error'
export interface SyncState { status: SyncStatus; pendingCount: number; pendingSales: number }

const deps: SyncDeps = {
  isOnline: () => navigator.onLine,
  // getSession() refreshes an expired token on its own when online.
  hasSession: async () => {
    const { data } = await supabase.auth.getSession()
    return !!data.session
  },
  upsert: async (table, rows, onConflict) => {
    const { error } = await supabase.from(table).upsert(rows, { onConflict })
    return { error: error ? { code: error.code, message: error.message } : null }
  },
}

// ── Tiny external store, so any component can read the status ────────────────
let state: SyncState = { status: navigator.onLine ? 'synced' : 'offline', pendingCount: 0, pendingSales: 0 }
const listeners = new Set<() => void>()

function setState(next: SyncState) {
  if (next.status === state.status && next.pendingCount === state.pendingCount && next.pendingSales === state.pendingSales) return
  state = next
  listeners.forEach(l => l())
}

export const getSyncState = () => state

// ── Engine ───────────────────────────────────────────────────────────────────
let authError = false
let running = false
let again = false
let debounce: ReturnType<typeof setTimeout> | undefined
let stopFns: (() => void)[] = []

async function refresh() {
  const n = await db.sync_queue.count()
  const sales = await db.sync_queue.where('table_name').equals('sales').count()
  const status: SyncStatus =
    !navigator.onLine ? 'offline' :
    authError && n > 0 ? 'auth-error' :
    n > 0 ? 'pending' : 'synced'
  setState({ status, pendingCount: n, pendingSales: sales })
}

async function run() {
  if (running) { again = true; return }
  running = true
  try {
    do {
      again = false
      const result = await pushQueue(deps)
      authError = result === 'auth-error'
      await refresh()
    } while (again)
  } catch (e) {
    console.error('[sync] unexpected error', e)
  } finally {
    running = false
  }
}

function schedule(ms = 1200) {
  clearTimeout(debounce)
  debounce = setTimeout(run, ms)
}

function start() {
  const onOnline = () => { authError = false; void refresh(); void run() }
  const onOffline = () => { void refresh() }
  window.addEventListener('online', onOnline)
  window.addEventListener('offline', onOffline)

  // Retry every 30 s while there is something to send
  const interval = setInterval(() => { if (navigator.onLine) void run() }, 30_000)

  // New queue entries (a sale, a restock...) trigger a push shortly after
  let lastCount = 0
  const sub = liveQuery(() => db.sync_queue.count()).subscribe({
    next: n => {
      void refresh()
      if (n > lastCount && navigator.onLine) schedule()
      lastCount = n
    },
    error: e => console.error('[sync] queue watcher', e),
  })

  // A fresh or refreshed login clears the "sign in to sync" state
  const { data: authSub } = supabase.auth.onAuthStateChange(event => {
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') { authError = false; void run() }
  })

  stopFns = [
    () => window.removeEventListener('online', onOnline),
    () => window.removeEventListener('offline', onOffline),
    () => clearInterval(interval),
    () => sub.unsubscribe(),
    () => authSub.subscription.unsubscribe(),
    () => clearTimeout(debounce),
  ]

  // First run: make sure pre-existing local data is queued, then push
  db.shop_settings.toCollection().first()
    .then(s => (s ? ensureBackfill(s.user_id) : undefined))
    .then(() => run())
    .catch(e => console.error('[sync] start failed', e))
}

function stop() {
  stopFns.forEach(f => f())
  stopFns = []
}

/** The engine runs while at least one component is subscribed (the sidebar indicator). */
export function subscribeSync(listener: () => void): () => void {
  listeners.add(listener)
  if (listeners.size === 1) start()
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) stop()
  }
}
