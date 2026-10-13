import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../lib/db'
import { S } from '../../lib/strings'
import { formatCurrency } from '../../lib/formatCurrency'
import type { ShopSettings, StockMovementType } from '../../types'
import { thStyle, tdStyle } from './tableStyles'

const TYPE_LABEL: Record<StockMovementType, string> = {
  initial: S.movementInitial,
  restock: S.movementRestock,
  adjustment: S.movementAdjustment,
}

export default function HistoryTab({ settings }: { settings: ShopSettings }) {
  const rows = useLiveQuery(async () => {
    const [movements, products] = await Promise.all([
      db.stock_movements.where('user_id').equals(settings.user_id).toArray(),
      db.products.where('user_id').equals(settings.user_id).toArray(),
    ])
    const names = new Map(products.map(p => [p.id, p.name]))
    return movements
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map(m => ({ ...m, productName: names.get(m.product_id) ?? '—' }))
  }, [settings.user_id])

  if (rows && rows.length === 0) {
    return <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', opacity: 0.6 }}>{S.historyEmpty}</p>
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={thStyle}>{S.colDate}</th>
          <th style={thStyle}>{S.colName}</th>
          <th style={thStyle}>{S.colType}</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>{S.colQty}</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>{S.colPurchasePrice}</th>
          <th style={thStyle}>{S.colReason}</th>
        </tr>
      </thead>
      <tbody>
        {(rows ?? []).map(m => (
          <tr key={m.id}>
            <td style={{ ...tdStyle, fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px' }}>
              {new Date(m.created_at).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </td>
            <td style={{ ...tdStyle, fontWeight: 600 }}>{m.productName}</td>
            <td style={tdStyle}>{TYPE_LABEL[m.type]}</td>
            <td style={{ ...tdStyle, textAlign: 'right', fontFamily: "'IBM Plex Mono', monospace" }}>
              {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
            </td>
            <td style={{ ...tdStyle, textAlign: 'right', fontFamily: "'IBM Plex Mono', monospace" }}>
              {m.purchase_price_int !== undefined ? formatCurrency(m.purchase_price_int, settings) : '—'}
            </td>
            <td style={{ ...tdStyle, opacity: 0.75 }}>{m.reason ?? ''}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
