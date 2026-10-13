import type { Product, Sale, SaleItem } from '../types'

export interface DashboardStats {
  todayRevenue: number
  deltaPct: number | null // vs yesterday; null when yesterday had no sales
  yesterdayRevenue: number
  todaySalesCount: number
  todayItems: number
  todayAvg: number
  weekRevenue: number
  weekSalesCount: number
  stockValue: number
  productCount: number
  lowOutCount: number
  top: { name: string; qty: number; revenue: number }[]
  recent: Sale[]
}

const DAY_MS = 86_400_000
const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }

export function computeStats(sales: Sale[], items: SaleItem[], products: Product[], now = new Date()): DashboardStats {
  const todayStart = startOfDay(now).getTime()
  const yesterdayStart = todayStart - DAY_MS
  const weekStart = todayStart - 6 * DAY_MS // today + the 6 days before
  const t = (s: Sale) => new Date(s.completed_at).getTime()
  const sum = (list: Sale[]) => list.reduce((n, s) => n + s.total_int, 0)

  const today = sales.filter(s => t(s) >= todayStart)
  const yesterday = sales.filter(s => t(s) >= yesterdayStart && t(s) < todayStart)
  const week = sales.filter(s => t(s) >= weekStart)

  const todayIds = new Set(today.map(s => s.id))
  const weekIds = new Set(week.map(s => s.id))
  const todayItems = items.filter(i => todayIds.has(i.sale_id)).reduce((n, i) => n + i.quantity, 0)

  const byProduct = new Map<string, { name: string; qty: number; revenue: number }>()
  for (const i of items) {
    if (!weekIds.has(i.sale_id)) continue
    const key = i.product_id || i.product_name_snapshot
    const row = byProduct.get(key) ?? { name: i.product_name_snapshot, qty: 0, revenue: 0 }
    row.qty += i.quantity
    row.revenue += i.line_total_int
    byProduct.set(key, row)
  }

  const todayRevenue = sum(today)
  const yesterdayRevenue = sum(yesterday)

  return {
    todayRevenue,
    yesterdayRevenue,
    deltaPct: yesterdayRevenue > 0 ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100) : null,
    todaySalesCount: today.length,
    todayItems,
    todayAvg: today.length ? Math.round(todayRevenue / today.length) : 0,
    weekRevenue: sum(week),
    weekSalesCount: week.length,
    stockValue: products.reduce((n, p) => n + p.stock * p.price_int, 0),
    productCount: products.length,
    lowOutCount: products.filter(p => p.stock <= p.threshold).length,
    top: [...byProduct.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    recent: [...sales].sort((a, b) => b.completed_at.localeCompare(a.completed_at)).slice(0, 6),
  }
}
