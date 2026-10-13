import { formatCurrency } from '../../lib/formatCurrency'
import type { CartLine } from '../../hooks/useSaleCart'
import type { ShopSettings } from '../../types'

interface Props {
  line: CartLine
  settings: ShopSettings
  onIncrement: (productId: string) => void
  onDecrement: (productId: string) => void
  isNew?: boolean  // triggers print animation in slice 4b
}

export default function ReceiptLine({ line, settings, onIncrement, onDecrement }: Props) {
  const lineTotal = formatCurrency(line.unitPriceInt * line.quantity, settings)

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 0',
      borderBottom: '1px dashed #D8D0BC',
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: '13px',
    }}>
      {/* Name + unit price */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '13px', fontWeight: 400, color: '#1B2A41' }}>
          {line.productName}
        </div>
        <div style={{ fontSize: '11px', opacity: 0.6, color: '#1B2A41' }}>
          {formatCurrency(line.unitPriceInt, settings)}
        </div>
      </div>

      {/* − qty + */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        <button
          onClick={() => onDecrement(line.productId)}
          style={{
            width: '22px', height: '22px',
            background: 'transparent', border: '1px solid #1B2A41',
            fontFamily: "'IBM Plex Mono', monospace", fontSize: '14px',
            cursor: 'pointer', padding: 0, lineHeight: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >−</button>
        <span style={{ width: '24px', textAlign: 'center' }}>{line.quantity}</span>
        <button
          onClick={() => onIncrement(line.productId)}
          disabled={line.quantity >= line.maxStock}
          style={{
            width: '22px', height: '22px',
            background: 'transparent', border: '1px solid #1B2A41',
            fontFamily: "'IBM Plex Mono', monospace", fontSize: '14px',
            cursor: line.quantity >= line.maxStock ? 'default' : 'pointer',
            opacity: line.quantity >= line.maxStock ? 0.4 : 1,
            padding: 0, lineHeight: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >+</button>
      </div>

      {/* Line total */}
      <div style={{ width: '72px', textAlign: 'right', fontSize: '13px', color: '#1B2A41' }}>
        {lineTotal}
      </div>
    </div>
  )
}
