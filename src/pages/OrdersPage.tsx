import { useEffect, useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import { useCurrentShop } from '../hooks/useCurrentShop'
import { formatCurrency, formatSaleNumber } from '../lib/formatCurrency'
import { S } from '../lib/strings'
import type { Sale, SaleItem, ShopSettings } from '../types'
import ReceiptPreview from '../components/orders/ReceiptPreview'

const mono = "'IBM Plex Mono', monospace"

export default function OrdersPage() {
  const shop = useCurrentShop()
  if (!shop) return <div style={{ padding: '2rem' }}>{S.loading}</div>
  return <Orders shop={shop} />
}

function dayKey(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function dayLabel(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1)
  if (dayKey(iso) === dayKey(today.toISOString())) return S.dayToday
  if (dayKey(iso) === dayKey(yesterday.toISOString())) return S.dayYesterday
  return d.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })
}

function Orders({ shop }: { shop: ShopSettings }) {
  const sales = useLiveQuery(() => db.sales.where('user_id').equals(shop.user_id).toArray(), [shop.user_id])
  const allItems = useLiveQuery(() => db.sale_items.where('user_id').equals(shop.user_id).toArray(), [shop.user_id])
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = document.activeElement
      const typing = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
      if (e.key === '/' && !typing) { e.preventDefault(); searchRef.current?.focus() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const itemsBySale = useMemo(() => {
    const map = new Map<string, SaleItem[]>()
    for (const i of allItems ?? []) {
      const list = map.get(i.sale_id)
      if (list) list.push(i); else map.set(i.sale_id, [i])
    }
    return map
  }, [allItems])

  const sorted = useMemo(
    () => [...(sales ?? [])].sort((a, b) => b.completed_at.localeCompare(a.completed_at)),
    [sales]
  )

  const q = query.trim().toLowerCase().replace('#', '')
  const filtered = q
    ? sorted.filter(s =>
        String(s.sale_number).padStart(4, '0').includes(q) ||
        String(s.sale_number) === q ||
        (s.customer_name ?? '').toLowerCase().includes(q))
    : sorted

  const selected: Sale | undefined = filtered.find(s => s.id === selectedId) ?? filtered[0]
  const selectedItems = selected ? itemsBySale.get(selected.id) ?? [] : []

  // group by day, keeping the sorted order
  const groups: { key: string; label: string; sales: Sale[] }[] = []
  for (const s of filtered) {
    const key = dayKey(s.completed_at)
    const last = groups[groups.length - 1]
    if (last && last.key === key) last.sales.push(s)
    else groups.push({ key, label: dayLabel(s.completed_at), sales: [s] })
  }

  const now = new Date()
  const dateStr = now.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long' })
  const timeStr = now.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px 24px 0', boxSizing: 'border-box', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
        <h1 style={{ fontWeight: 600, fontSize: '26px', margin: 0 }}>{S.ordersTitle}</h1>
        <span style={{ fontFamily: mono, fontSize: '12px', opacity: 0.6 }}>{dateStr} · {timeStr}</span>
      </div>

      <div style={{ display: 'flex', gap: '24px', flex: 1, minHeight: 0, paddingBottom: '20px', overflow: 'hidden' }}>
        {/* Orders list */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <input
            ref={searchRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={S.ordersSearchPlaceholder}
            aria-label={S.ordersSearchPlaceholder}
            style={{
              width: '100%', padding: '8px 12px', fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '14px',
              background: 'transparent', border: '1px solid #1B2A41', outline: 'none', color: '#1B2A41',
              boxSizing: 'border-box', marginBottom: '12px',
            }}
          />

          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            {sales && sales.length === 0 ? (
              <p style={{ fontFamily: mono, fontSize: '12px', opacity: 0.6 }}>{S.ordersEmpty}</p>
            ) : filtered.length === 0 ? (
              <p style={{ fontFamily: mono, fontSize: '12px', opacity: 0.6 }}>{S.ordersNoMatch}</p>
            ) : (
              groups.map(g => (
                <section key={g.key}>
                  <h2 style={{
                    fontFamily: mono, fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase',
                    fontWeight: 600, opacity: 0.65, margin: '14px 0 0', padding: '0 0 6px', borderBottom: '2px solid #1B2A41',
                  }}>{g.label}</h2>
                  {g.sales.map(s => {
                    const active = selected?.id === s.id
                    const count = (itemsBySale.get(s.id) ?? []).reduce((n, i) => n + i.quantity, 0)
                    return (
                      <button
                        key={s.id}
                        onClick={() => setSelectedId(s.id)}
                        aria-current={active ? 'true' : undefined}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '16px', width: '100%', textAlign: 'left',
                          padding: '10px 12px', cursor: 'pointer', color: '#1B2A41',
                          background: active ? '#FFFDF7' : 'transparent',
                          border: 'none', borderBottom: '1px solid #1B2A41',
                          borderLeft: active ? '3px solid #1B2A41' : '3px solid transparent',
                        }}
                      >
                        <span style={{ fontFamily: mono, fontWeight: 600, fontSize: '14px', width: '64px' }}>{formatSaleNumber(s.sale_number)}</span>
                        <span style={{ fontFamily: mono, fontSize: '12px', opacity: 0.65, width: '64px' }}>
                          {new Date(s.completed_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span style={{ flex: 1, minWidth: 0, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.customer_name || S.noCustomer}
                        </span>
                        <span style={{ fontFamily: mono, fontSize: '12px', opacity: 0.65 }}>{S.itemsShort(count)}</span>
                        <span style={{ fontFamily: mono, fontWeight: 600, fontSize: '14px', minWidth: '90px', textAlign: 'right' }}>
                          {formatCurrency(s.total_int, shop)}
                        </span>
                      </button>
                    )
                  })}
                </section>
              ))
            )}
          </div>

          {sales && sales.length > 0 && (
            <div style={{ marginTop: '10px', fontFamily: mono, fontSize: '12px', opacity: 0.7, flexShrink: 0 }}>
              {S.ordersCount(filtered.length, sales.length)}
            </div>
          )}
        </div>

        {/* Receipt preview */}
        {selected ? (
          <ReceiptPreview sale={selected} items={selectedItems} shop={shop} />
        ) : (
          <div style={{
            width: '330px', minWidth: '330px', background: '#FFFDF7', border: '1px solid #D8D0BC', borderLeft: '3px solid #B3362B',
            display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', height: '100%',
            fontFamily: mono, fontSize: '12px', opacity: 0.5, padding: '0 24px', textAlign: 'center',
          }}>
            {S.ordersSelect}
          </div>
        )}
      </div>
    </div>
  )
}
