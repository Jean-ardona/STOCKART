import { S } from '../../lib/strings'
import { formatCurrency, formatSaleNumber } from '../../lib/formatCurrency'
import { printReceipt } from '../../lib/printReceipt'
import { buildReceiptData } from '../../lib/receiptData'
import type { Sale, SaleItem, ShopSettings } from '../../types'

const mono = "'IBM Plex Mono', monospace"

interface Props { sale: Sale; items: SaleItem[]; shop: ShopSettings }

/** Read-only receipt, same look as the POS receipt strip. */
export default function ReceiptPreview({ sale, items, shop }: Props) {
  const itemsCount = items.reduce((n, i) => n + i.quantity, 0)

  return (
    <div style={{
      width: '330px', minWidth: '330px', background: '#FFFDF7', border: '1px solid #D8D0BC',
      borderLeft: '3px solid #B3362B', display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden', boxSizing: 'border-box',
    }}>
      <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid #D8D0BC', position: 'relative' }}>
        <div style={{ fontWeight: 600, fontSize: '17px' }}>{shop.shop_name}</div>
        {shop.contact && <div style={{ fontFamily: mono, fontSize: '11px', opacity: 0.6, marginTop: '2px' }}>{shop.contact}</div>}
        <div style={{ fontFamily: mono, fontSize: '11px', opacity: 0.6, marginTop: '2px' }}>
          Sale {formatSaleNumber(sale.sale_number)} · {new Date(sale.completed_at).toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short' })}
        </div>
        <span style={{
          position: 'absolute', top: '12px', right: '12px', fontFamily: mono, fontWeight: 600, fontSize: '12px',
          color: '#B3362B', border: '2px solid #B3362B', padding: '1px 6px', transform: 'rotate(-8deg)', opacity: 0.85,
        }}>{S.stampPaid}</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 14px' }}>
        {items.map(i => (
          <div key={i.id} style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '6px 0', borderBottom: '1px dashed #D8D0BC' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px' }}>{i.product_name_snapshot}</div>
              <div style={{ fontFamily: mono, fontSize: '11px', opacity: 0.6 }}>
                {i.quantity} × {formatCurrency(i.unit_price_int_snapshot, shop)}
              </div>
            </div>
            <div style={{ fontFamily: mono, fontSize: '13px', textAlign: 'right' }}>{formatCurrency(i.line_total_int, shop)}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: '10px 14px', borderTop: '1px solid #D8D0BC' }}>
        {sale.customer_name && (
          <div style={{ fontSize: '13px', paddingBottom: '6px', marginBottom: '10px', borderBottom: '1px solid #D8D0BC' }}>
            {sale.customer_name}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: mono, fontSize: '13px', opacity: 0.7, marginBottom: '6px' }}>
          <span>{S.receiptItems}</span><span>{itemsCount}</span>
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '2px solid #1B2A41',
          paddingTop: '8px', marginBottom: '12px', fontFamily: mono, fontWeight: 600, fontSize: '18px',
        }}>
          <span>{S.receiptTotal}</span><span>{formatCurrency(sale.total_int, shop)}</span>
        </div>
        <button
          onClick={() => printReceipt(buildReceiptData(sale, items, shop))}
          style={{
            width: '100%', background: '#1B2A41', color: '#F3EEE2', border: 'none', padding: '13px',
            fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: '14px',
            letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
          }}
        >
          {S.btnPrintAgain}
        </button>
      </div>
    </div>
  )
}
