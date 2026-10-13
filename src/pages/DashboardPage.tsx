import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import { useCurrentShop } from '../hooks/useCurrentShop'
import { useProducts } from '../hooks/useProducts'
import { computeStats } from '../lib/dashboardStats'
import { formatCurrency, formatSaleNumber } from '../lib/formatCurrency'
import { S } from '../lib/strings'
import type { Product, ShopSettings } from '../types'
import SalesChart, { type ChartMode } from '../components/dashboard/SalesChart'
import MovementModal from '../components/stock/MovementModal'
import { thStyle, tdStyle, smallBtn } from '../components/stock/tableStyles'

const mono = "'IBM Plex Mono', monospace"
const sans = "'IBM Plex Sans', sans-serif"

export default function DashboardPage() {
  const settings = useCurrentShop()
  if (!settings) return <div style={{ padding: '2rem' }}>{S.loading}</div>
  return <Dashboard settings={settings} />
}

function Kpi({ label, value, sub, subTone, inverted }: {
  label: string; value: string; sub: string; subTone?: 'down'; inverted?: boolean
}) {
  return (
    <div style={{
      border: '1px solid #1B2A41', padding: '14px 18px', minWidth: 0,
      background: inverted ? '#1B2A41' : '#FFFDF7', color: inverted ? '#F3EEE2' : '#1B2A41',
    }}>
      <div style={{ fontFamily: mono, fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.7, marginBottom: '6px' }}>{label}</div>
      <div style={{ fontFamily: mono, fontSize: '26px', fontWeight: 600, whiteSpace: 'nowrap' }}>{value}</div>
      <div style={{
        fontFamily: mono, fontSize: '12px', marginTop: '6px', minHeight: '16px',
        opacity: subTone === 'down' ? 1 : 0.7,
        color: subTone === 'down' ? (inverted ? '#F0958B' : '#B3362B') : undefined,
      }}>{sub}</div>
    </div>
  )
}

function Dashboard({ settings }: { settings: ShopSettings }) {
  const sales = useLiveQuery(() => db.sales.where('user_id').equals(settings.user_id).toArray(), [settings.user_id]) ?? []
  const items = useLiveQuery(() => db.sale_items.where('user_id').equals(settings.user_id).toArray(), [settings.user_id]) ?? []
  const products = useProducts(settings.user_id)
  const [mode, setMode] = useState<ChartMode>('day')
  const [restocking, setRestocking] = useState<Product | null>(null)

  const now = new Date()
  const stats = computeStats(sales, items, products, now)
  const money = (n: number) => formatCurrency(n, settings)
  const lowStock = products.filter(p => p.stock <= p.threshold).sort((a, b) => a.stock - b.stock)
  const topMax = Math.max(1, ...stats.top.map(t => t.revenue))

  const dateStr = now.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long' })
  const timeStr = now.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })

  const sectionTitle = { fontFamily: sans, fontWeight: 600, fontSize: '16px', margin: 0 } as const
  const emptyText = { fontFamily: mono, fontSize: '12px', opacity: 0.6 } as const

  const deltaSub =
    stats.deltaPct !== null ? S.vsYesterday(stats.deltaPct) :
    stats.todayRevenue > 0 ? S.noSalesYesterday : '—'

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '20px 24px 28px', boxSizing: 'border-box', position : "relative" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', position : 'fixed', top: 0, left : 190, background: "#F5F0E8", width: "calc(100% - 210px)", paddingInline: 20, height : 60, zIndex:1 }}>
        <h1 style={{ fontFamily: sans, fontWeight: 600, fontSize: '26px', margin: 0 }}>{S.dashboardTitle}</h1>
        <span style={{ fontFamily: mono, fontSize: '12px', opacity: 0.6 }}>{dateStr} · {timeStr}</span>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px', marginTop : 60 }}>
        <Kpi inverted label={S.todayRevenue} value={money(stats.todayRevenue)} sub={deltaSub}
          subTone={stats.deltaPct !== null && stats.deltaPct < 0 ? 'down' : undefined} />
        <Kpi label={S.todaySales} value={String(stats.todaySalesCount)}
          sub={S.itemsAndAvg(stats.todayItems, money(stats.todayAvg))} />
        <Kpi label={S.last7Days} value={money(stats.weekRevenue)} sub={S.salesCount(stats.weekSalesCount)} />
        <Kpi label={S.stockValue} value={money(stats.stockValue)} sub={S.productsLowOut(stats.productCount, stats.lowOutCount)} />
      </div>

      {/* Chart + low stock */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', alignItems: 'start', marginBottom: '32px' }}>
        <section style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h2 style={sectionTitle}>{S.chartTitle}</h2>
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['day', 'week'] as ChartMode[]).map(m => (
                <button
                  key={m}
                  aria-pressed={mode === m}
                  onClick={() => setMode(m)}
                  style={{
                    fontFamily: mono, fontSize: '12px', padding: '6px 12px', cursor: 'pointer',
                    background: mode === m ? '#1B2A41' : 'transparent', color: mode === m ? '#F3EEE2' : '#1B2A41',
                    border: '1px solid #1B2A41',
                  }}
                >
                  {m === 'day' ? S.btnDay : S.btnWeek}
                </button>
              ))}
            </div>
          </div>
          <SalesChart sales={sales} mode={mode} settings={settings} />
        </section>

        <section style={{ minWidth: 0 }}>
          <h2 style={{ ...sectionTitle, margin: '0 0 8px' }}>{S.lowStockTitle}</h2>
          {lowStock.length === 0 ? (
            <p style={emptyText}>{S.lowStockEmpty}</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>{S.colName}</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>{S.colStock}</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>{S.colThreshold}</th>
                  <th style={thStyle} />
                </tr>
              </thead>
              <tbody>
                {lowStock.map(p => (
                  <tr key={p.id}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{p.name}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: mono, color: p.stock === 0 ? '#B3362B' : undefined }}>{p.stock}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: mono, opacity: 0.7 }}>{p.threshold}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <button style={smallBtn} onClick={() => setRestocking(p)}>{S.btnRestock}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      {/* Top products + recent sales */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', alignItems: 'start' }}>
        <section style={{ minWidth: 0 }}>
          <h2 style={{ ...sectionTitle, margin: '0 0 10px', paddingBottom: '6px', borderBottom: '2px solid #1B2A41' }}>{S.topProductsTitle}</h2>
          {stats.top.length === 0 ? (
            <p style={emptyText}>{S.noTopProducts}</p>
          ) : (
            stats.top.map(t => (
              <div key={t.name} style={{ display: 'grid', gridTemplateColumns: '170px 1fr 170px', alignItems: 'center', gap: '14px', padding: '8px 0', borderBottom: '1px solid #D8D0BC' }}>
                <span style={{ fontWeight: 600, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                <div
                  role="img"
                  aria-label={`${t.name}: ${S.soldRevenue(t.qty, money(t.revenue))}`}
                  style={{
                    height: '18px', width: `${Math.max(2, (t.revenue / topMax) * 100)}%`, border: '1.5px solid #1B2A41',
                    background: 'repeating-linear-gradient(45deg, rgba(27,42,65,0.5) 0 1.5px, transparent 1.5px 6px)',
                  }}
                />
                <span style={{ fontFamily: mono, fontSize: '12px', textAlign: 'right' }}>{S.soldRevenue(t.qty, money(t.revenue))}</span>
              </div>
            ))
          )}
        </section>

        <section style={{ minWidth: 0 }}>
          <h2 style={{ ...sectionTitle, margin: '0 0 10px', paddingBottom: '6px', borderBottom: '2px solid #1B2A41' }}>{S.recentSalesTitle}</h2>
          {stats.recent.length === 0 ? (
            <p style={emptyText}>{S.noRecentSales}</p>
          ) : (
            <>
              {stats.recent.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'baseline', gap: '12px', padding: '8px 0', borderBottom: '1px solid #D8D0BC' }}>
                  <span style={{ fontFamily: mono, fontWeight: 600, fontSize: '13px' }}>{formatSaleNumber(s.sale_number)}</span>
                  <span style={{ fontFamily: mono, fontSize: '12px', opacity: 0.65 }}>
                    {new Date(s.completed_at).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span style={{ flex: 1, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.8 }}>{s.customer_name ?? ''}</span>
                  <span style={{ fontFamily: mono, fontWeight: 600, fontSize: '13px' }}>{money(s.total_int)}</span>
                </div>
              ))}
              <Link to="/orders" style={{ display: 'inline-block', marginTop: '10px', fontFamily: mono, fontSize: '12px', color: '#1B2A41' }}>
                {S.viewAllOrders}
              </Link>
            </>
          )}
        </section>
      </div>

      {restocking && <MovementModal mode="restock" product={restocking} settings={settings} onClose={() => setRestocking(null)} />}
    </div>
  )
}
