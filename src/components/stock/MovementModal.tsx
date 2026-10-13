import { useState } from 'react'
import { S } from '../../lib/strings'
import { parseMoney } from '../../lib/money'
import { restockProduct, adjustProduct } from '../../lib/stockOps'
import type { Product, ShopSettings } from '../../types'
import Modal from './Modal'
import { labelStyle, inputStyle, primaryBtn, ghostBtn, errorStyle } from './formStyles'

interface Props {
  mode: 'restock' | 'adjust'
  product: Product
  settings: ShopSettings
  onClose: () => void
}

export default function MovementModal({ mode, product, settings, onClose }: Props) {
  const [qty, setQty] = useState('')
  const [price, setPrice] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const isRestock = mode === 'restock'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const n = Number(qty.replace('−', '-'))
    if (!Number.isInteger(n) || n === 0 || (isRestock && n < 0)) {
      return setError(isRestock ? S.errorQtyPositive : S.errorAdjustInvalid)
    }
    if (!isRestock && !reason.trim()) return setError(S.errorReasonRequired)
    if (!isRestock && product.stock + n < 0) return setError(S.errorStockNegative)

    let priceInt: number | undefined
    if (isRestock && price.trim() !== '') {
      const p = parseMoney(price, settings)
      if (p === null) return setError(S.errorPriceInvalid)
      priceInt = p
    }

    setSaving(true); setError('')
    try {
      if (isRestock) await restockProduct(settings.user_id, product.id, n, priceInt)
      else await adjustProduct(settings.user_id, product.id, n, reason)
      onClose()
    } catch (err) {
      console.error(err)
      setError(S.errorSaveFailed)
      setSaving(false)
    }
  }

  return (
    <Modal
      title={isRestock ? S.restockTitle : S.adjustTitle}
      subtitle={`${product.name} · ${S.currentStock(product.stock)}`}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <label htmlFor="mv-qty" style={labelStyle}>{isRestock ? S.labelQtyReceived : S.labelAdjQty}</label>
        <input id="mv-qty" autoFocus inputMode="numeric" value={qty} onChange={e => setQty(e.target.value)} style={inputStyle} />

        {isRestock ? (
          <>
            <label htmlFor="mv-price" style={labelStyle}>{S.labelPurchasePrice}</label>
            <input id="mv-price" inputMode="decimal" value={price} onChange={e => setPrice(e.target.value)} style={inputStyle} />
          </>
        ) : (
          <>
            <label htmlFor="mv-reason" style={labelStyle}>{S.labelReason}</label>
            <input id="mv-reason" value={reason} onChange={e => setReason(e.target.value)} style={inputStyle} />
          </>
        )}

        {error && <p style={errorStyle}>{error}</p>}

        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" onClick={onClose} style={{ ...ghostBtn, flex: 1 }}>{S.btnCancel}</button>
          <button type="submit" disabled={saving} style={{ ...primaryBtn, flex: 2 }}>
            {saving ? S.btnSaving : S.btnSave}
          </button>
        </div>
      </form>
    </Modal>
  )
}
