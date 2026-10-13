import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import { useCurrentShop } from '../hooks/useCurrentShop'
import { useProducts } from '../hooks/useProducts'
import { formatCurrency } from '../lib/formatCurrency'
import { S } from '../lib/strings'
import type { Product, ShopSettings } from '../types'
import SalesChart, { type ChartMode } from '../components/dashboard/SalesChart'
import MovementModal from '../components/stock/MovementModal'
import { thStyle, tdStyle, smallBtn } from '../components/stock/tableStyles'

const mono = "'IBM Plex Mono', monospace"

export default function DashboardPage() {
  const settings = useCurrentShop()
  if (!settings) return <div style={{ padding: '2rem' }}>{S.loading}</div>
  return <Dashboard settings={settings} />
}

function Dashboard({ settings }: { settings: ShopSettings }) {
  const sales = useLiveQuery(() => db.sales.where('user_id').equals(settings.user_id).toArray(), [settings.user_id]) ?? []
  const products = useProducts(settings.user_id)
  const [mode, setMode] = useState<ChartMode>('day')
  const [restocking, setRestocking] = useState<Product | null>(null)

  const now = new Date()
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
  const todaySales = sales.filter(s => new Date(s.completed_at) >= todayStart)
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.total_int, 0)
  const lowStock = products.filter(p => p.stock <= p.threshold).sort((a, b) => a.stock - b.stock)

  const dateStr = now.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long' })
  const timeStr = now.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })

  const box = { border: '1px solid #1B2A41', padding: '14px 18px', minWidth: '200px', background: '#FFFDF7' } as const
  const boxLabel = { fontFamily: mono, fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.7, marginBottom: '6px' } as const
  const boxValue = { fontFamily: mono, fontSize: '28px', fontWeight: 600 } as const

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '20px 24px', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
        <h1 style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: '26px', margin: 0 }}>{S.dashboardTitle}</h1>
        <span style={{ fontFamily: mono, fontSize: '12px', opacity: 0.6 }}>{dateStr} · {timeStr}</span>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <div style={box}>
          <div style={boxLabel}>{S.todayRevenue}</div>
          <div style={boxValue}>{formatCurrency(todayRevenue, settings)}</div>
        </div>
        <div style={box}>
          <div style={boxLabel}>{S.todaySales}</div>
          <div style={boxValue}>{todaySales.length}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Chart */}
        <section style={{ flex: '2 1 460px', minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h2 style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: '16px', margin: 0 }}>{S.chartTitle}</h2>
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

        {/* Low stock */}
        <section style={{ flex: '1 1 320px', minWidth: 0 }}>
          <h2 style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: '16px', margin: '0 0 8px' }}>{S.lowStockTitle}</h2>
          {lowStock.length === 0 ? (
            <p style={{ fontFamily: mono, fontSize: '12px', opacity: 0.6 }}>{S.lowStockEmpty}</p>
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

      {restocking && <MovementModal mode="restock" product={restocking} settings={settings} onClose={() => setRestocking(null)} />}
    </div>
  )
}
