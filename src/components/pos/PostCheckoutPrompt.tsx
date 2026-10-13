import { useEffect } from 'react'
import { formatCurrency, formatSaleNumber } from '../../lib/formatCurrency'
import { printReceipt } from '../../lib/printReceipt'
import { S } from '../../lib/strings'
import type { CompletedSaleData } from '../../types'

interface Props {
  data: CompletedSaleData | null
  onDismiss: () => void
}

/**
 * Brief overlay shown after checkout.
 * Auto-dismisses after 4 seconds or on button click.
 * lastCompletedSale stays in context until next checkout — do not clear here.
 */
export default function PostCheckoutPrompt({ data, onDismiss }: Props) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [onDismiss])

  function handlePrint() {
    if (data) {
      const { sale, items, shopSettings } = data
      printReceipt({
        shopName: shopSettings.shop_name,
        contact: shopSettings.contact || undefined,
        saleNumber: formatSaleNumber(sale.sale_number),
        dateTime: new Date(sale.completed_at).toLocaleString('en', {
          dateStyle: 'medium', timeStyle: 'short',
        }),
        customerName: sale.customer_name || undefined,
        lines: items.map(i => ({
          name: i.product_name_snapshot,
          qty: i.quantity,
          unitPrice: formatCurrency(i.unit_price_int_snapshot, shopSettings),
          lineTotal: formatCurrency(i.line_total_int, shopSettings),
        })),
        itemsCount: items.reduce((s, i) => s + i.quantity, 0),
        total: formatCurrency(sale.total_int, shopSettings),
      })
    }
    onDismiss()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(27,42,65,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 50,
    }}>
      <div style={{
        background: '#FFFDF7',
        border: '1px solid #1B2A41',
        padding: '32px 40px',
        textAlign: 'center',
        minWidth: '280px',
      }}>
        <div style={{
          display: 'inline-block',
          fontFamily: "'IBM Plex Mono', monospace",
          fontWeight: 600, fontSize: '20px',
          color: '#B3362B', border: '3px solid #B3362B',
          padding: '6px 14px', transform: 'rotate(-10deg)',
          opacity: 0.85, marginBottom: '24px',
        }}>
          {S.stampPaid}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={handlePrint}
            style={{
              display: 'block', width: '100%',
              background: '#1B2A41', color: '#F3EEE2',
              border: 'none', padding: '12px',
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontWeight: 600, fontSize: '13px',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              cursor: 'pointer', marginBottom: '8px',
            }}
          >
            {S.btnDownloadPDF}
          </button>
          <button
            onClick={onDismiss}
            style={{
              background: 'transparent', border: 'none',
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '12px', color: 'rgba(27,42,65,0.6)',
              cursor: 'pointer', textDecoration: 'underline',
            }}
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  )
}
