import { S } from '../../lib/strings'
import { formatCurrency, formatSaleNumber } from '../../lib/formatCurrency'
import ReceiptLine from './ReceiptLine'
import type { CartLine } from '../../hooks/useSaleCart'
import type { ShopSettings } from '../../types'

interface Props {
  lines: CartLine[]
  totalInt: number
  totalItems: number
  customerName: string
  saleNumber: number
  shopName: string
  settings: ShopSettings
  onIncrement: (productId: string) => void
  onDecrement: (productId: string) => void
  onCustomerName: (name: string) => void
  onCheckout: () => void
  onClear: () => void
  checkoutDisabled: boolean
}

export default function ReceiptStrip({
  lines, totalInt, totalItems, customerName,
  saleNumber, shopName, settings,
  onIncrement, onDecrement, onCustomerName,
  onCheckout, onClear, checkoutDisabled,
}: Props) {
  return (
    <div style={{
      width: '330px',
      minWidth: '330px',
      background: '#FFFDF7',
      border: '1px solid #D8D0BC',
      borderLeft: '3px solid #B3362B',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
      boxSizing: 'border-box',
    }}>
      {/* Receipt header */}
      <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid #D8D0BC', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: '17px' }}>
            {shopName}
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', opacity: 0.6, marginTop: '2px' }}>
            Sale {formatSaleNumber(saleNumber)}
          </div>
        </div>
        {lines.length > 0 && (
          <button
            onClick={onClear}
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '11px',
              color: '#B3362B',
              border: '1px solid #B3362B',
              background: 'transparent',
              padding: '2px 7px',
              cursor: 'pointer',
              letterSpacing: '0.05em',
            }}
          >
            CLEAR
          </button>
        )}
      </div>

      {/* Line items — scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 14px' }}>
        {lines.length === 0 ? (
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px',
            opacity: 0.4, textAlign: 'center', paddingTop: '32px',
          }}>
            — ready —
          </div>
        ) : (
          lines.map(line => (
            <ReceiptLine
              key={line.productId}
              line={line}
              settings={settings}
              onIncrement={onIncrement}
              onDecrement={onDecrement}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid #D8D0BC' }}>
        {/* Customer name */}
        <input
          value={customerName}
          onChange={e => onCustomerName(e.target.value)}
          placeholder={S.placeholderCustomer}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid #D8D0BC',
            padding: '5px 0',
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '13px',
            color: '#1B2A41',
            outline: 'none',
            marginBottom: '10px',
            boxSizing: 'border-box',
          }}
        />

        {/* Items row */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px',
          opacity: 0.7, marginBottom: '6px',
        }}>
          <span>{S.receiptItems}</span>
          <span>{totalItems}</span>
        </div>

        {/* Total row */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          borderTop: '2px solid #1B2A41', paddingTop: '8px', marginBottom: '12px',
          fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, fontSize: '18px',
        }}>
          <span>{S.receiptTotal}</span>
          <span>{formatCurrency(totalInt, settings)}</span>
        </div>

        {/* Checkout button */}
        <button
          onClick={onCheckout}
          disabled={checkoutDisabled}
          style={{
            width: '100%',
            background: checkoutDisabled ? '#D8D0BC' : '#1B2A41',
            color: '#F3EEE2',
            border: 'none',
            padding: '13px',
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontWeight: 600,
            fontSize: '14px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            cursor: checkoutDisabled ? 'default' : 'pointer',
          }}
        >
          {S.btnCheckout}
        </button>
      </div>
    </div>
  )
}
