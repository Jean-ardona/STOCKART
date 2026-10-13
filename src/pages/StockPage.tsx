import { useEffect, useRef, useState } from 'react'
import { useProducts } from '../hooks/useProducts'
import { useCurrentShop } from '../hooks/useCurrentShop'
import { archiveProduct } from '../lib/stockOps'
import { formatCurrency } from '../lib/formatCurrency'
import { S } from '../lib/strings'
import type { Product, ShopSettings } from '../types'
import ProductFormModal from '../components/stock/ProductFormModal'
import MovementModal from '../components/stock/MovementModal'
import HistoryTab from '../components/stock/HistoryTab'
import { thStyle, tdStyle, smallBtn } from '../components/stock/tableStyles'

type Tab = 'products' | 'history'
type Dialog =
  | { kind: 'add' }
  | { kind: 'edit'; product: Product }
  | { kind: 'restock' | 'adjust'; product: Product }
  | null

const stamp = {
  fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, fontSize: '9px',
  color: '#B3362B', border: '2px solid #B3362B', padding: '1px 3px',
  transform: 'rotate(-6deg)', letterSpacing: '0.05em', marginLeft: '8px', display: 'inline-block',
} as const

export default function StockPage() {
  const settings = useCurrentShop()
  if (!settings) return <div style={{ padding: '2rem' }}>{S.loading}</div>
  return <StockScreen settings={settings} />
}

function StockScreen({ settings }: { settings: ShopSettings }) {
  const products = useProducts(settings.user_id)
  const [tab, setTab] = useState<Tab>('products')
  const [query, setQuery] = useState('')
  const [lowOnly, setLowOnly] = useState(false)
  const [dialog, setDialog] = useState<Dialog>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // "/" focuses the search bar
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = document.activeElement
      const typing = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement
      if (e.key === '/' && !typing && !dialog) { e.preventDefault(); searchRef.current?.focus() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dialog])

  // Archive needs a second click within 4 seconds
  useEffect(() => {
    if (!confirmId) return
    const t = setTimeout(() => setConfirmId(null), 4000)
    return () => clearTimeout(t)
  }, [confirmId])

  const shown = products.filter(p =>
    p.name.toLowerCase().includes(query.trim().toLowerCase()) &&
    (!lowOnly || p.stock <= p.threshold)
  )

  const now = new Date()
  const dateStr = now.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long' })
  const timeStr = now.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px 24px 0', boxSizing: 'border-box', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
        <h1 style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: '26px', margin: 0 }}>{S.stockTitle}</h1>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', opacity: 0.6 }}>{dateStr} · {timeStr}</span>
      </div>

      {/* Tabs */}
      <div role="tablist" style={{ display: 'flex', gap: '24px', marginBottom: '14px', borderBottom: '1px solid #D8D0BC' }}>
        {(['products', 'history'] as Tab[]).map(t => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer', padding: '0 0 6px',
              fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '14px', color: '#1B2A41',
              fontWeight: tab === t ? 600 : 400, opacity: tab === t ? 1 : 0.65,
              borderBottom: tab === t ? '2px solid #1B2A41' : '2px solid transparent', marginBottom: '-1px',
            }}
          >
            {t === 'products' ? S.tabProducts : S.tabHistory}
          </button>
        ))}
      </div>

      {tab === 'products' && (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
          <input
            ref={searchRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={S.searchPlaceholder}
            aria-label={S.searchPlaceholder}
            style={{
              flex: 1, padding: '8px 12px', fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '14px',
              background: 'transparent', border: '1px solid #1B2A41', outline: 'none', color: '#1B2A41', boxSizing: 'border-box',
            }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={lowOnly} onChange={e => setLowOnly(e.target.checked)} />
            {S.filterLowStock}
          </label>
          <button
            onClick={() => setDialog({ kind: 'add' })}
            style={{ background: '#1B2A41', color: '#F3EEE2', border: '1px solid #1B2A41', padding: '9px 14px', fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            {S.btnAddProduct}
          </button>
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingBottom: '20px' }}>
        {tab === 'history' ? (
          <HistoryTab settings={settings} />
        ) : products.length === 0 ? (
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', opacity: 0.6 }}>{S.stockEmpty}</p>
        ) : shown.length === 0 ? (
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', opacity: 0.6 }}>{S.stockNoMatch}</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>{S.colName}</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>{S.colPrice}</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>{S.colStock}</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>{S.colThreshold}</th>
                <th style={thStyle} />
              </tr>
            </thead>
            <tbody>
              {shown.map(p => {
                const out = p.stock === 0
                const low = !out && p.stock <= p.threshold
                return (
                  <tr key={p.id}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{p.name}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: "'IBM Plex Mono', monospace" }}>{formatCurrency(p.price_int, settings)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: "'IBM Plex Mono', monospace", whiteSpace: 'nowrap' }}>
                      {p.stock.toLocaleString('en')}
                      {(out || low) && <span style={stamp}>{out ? S.stampOut : S.stampLow}</span>}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: "'IBM Plex Mono', monospace", opacity: 0.7 }}>{p.threshold}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button style={smallBtn} onClick={() => setDialog({ kind: 'restock', product: p })}>{S.btnRestock}</button>
                      <button style={smallBtn} onClick={() => setDialog({ kind: 'adjust', product: p })}>{S.btnAdjust}</button>
                      <button style={smallBtn} onClick={() => setDialog({ kind: 'edit', product: p })}>{S.btnEdit}</button>
                      <button
                        style={{ ...smallBtn, color: '#B3362B', borderColor: '#B3362B', fontWeight: confirmId === p.id ? 600 : 400 }}
                        onClick={async () => {
                          if (confirmId === p.id) { setConfirmId(null); await archiveProduct(p.id) }
                          else setConfirmId(p.id)
                        }}
                      >
                        {confirmId === p.id ? S.btnConfirm : S.btnArchive}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {dialog?.kind === 'add' && <ProductFormModal settings={settings} onClose={() => setDialog(null)} />}
      {dialog?.kind === 'edit' && <ProductFormModal settings={settings} product={dialog.product} onClose={() => setDialog(null)} />}
      {(dialog?.kind === 'restock' || dialog?.kind === 'adjust') && (
        <MovementModal mode={dialog.kind} product={dialog.product} settings={settings} onClose={() => setDialog(null)} />
      )}
    </div>
  )
}
