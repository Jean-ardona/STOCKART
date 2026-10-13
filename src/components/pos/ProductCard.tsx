import { S } from '../../lib/strings'
import { formatCurrency } from '../../lib/formatCurrency'
import type { Product } from '../../types'
import type { ShopSettings } from '../../types'

interface Props {
  product: Product
  settings: ShopSettings
  onTap: (product: Product) => void
}

export default function ProductCard({ product, settings, onTap }: Props) {
  const isOut = product.stock === 0
  const isLow = !isOut && product.stock <= product.threshold

  return (
    <button
      onClick={() => !isOut && onTap(product)}
      disabled={isOut}
      style={{
        textAlign: 'left',
        background: '#FFFDF7',
        border: '1px solid #1B2A41',
        padding: '7px 9px',
        cursor: isOut ? 'default' : 'pointer',
        opacity: isOut ? 0.5 : 1,
        position: 'relative',
        width: '100%',
        height: '100%',
        color: '#1B2A41',
      }}
    >
      {/* LOW stamp */}
      {isLow && (
        <span style={{
          position: 'absolute', top: '4px', right: '4px',
          fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, fontSize: '9px',
          color: '#B3362B', border: '2px solid #B3362B',
          padding: '1px 3px', transform: 'rotate(-6deg)',
          letterSpacing: '0.05em',
        }}>
          {S.stampLow}
        </span>
      )}

      {/* OUT stamp */}
      {isOut && (
        <span style={{
          position: 'absolute', top: '4px', right: '4px',
          fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, fontSize: '9px',
          color: '#B3362B', border: '2px solid #B3362B',
          padding: '1px 3px', transform: 'rotate(-6deg)',
          letterSpacing: '0.05em',
        }}>
          {S.stampOut}
        </span>
      )}

      <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: '13px', marginBottom: '2px', color: '#1B2A41', lineHeight: 1.2 }}>
        {product.name}
      </div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '14px', marginBottom: '1px', color: '#1B2A41' }}>
        {formatCurrency(product.price_int, settings)}
      </div>
      <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '11px', opacity: 0.6, color: '#1B2A41' }}>
        Stock {product.stock.toLocaleString('en')}
      </div>
    </button>
  )
}
