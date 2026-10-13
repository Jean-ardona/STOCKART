import { useState } from 'react'
import { S } from '../../lib/strings'
import { parseMoney, moneyToInput } from '../../lib/money'
import { addProduct, editProduct } from '../../lib/stockOps'
import type { Product, ShopSettings } from '../../types'
import Modal from './Modal'
import { labelStyle, inputStyle, primaryBtn, ghostBtn, errorStyle } from './formStyles'

interface Props {
  settings: ShopSettings
  product?: Product // present = edit mode
  onClose: () => void
}

export default function ProductFormModal({ settings, product, onClose }: Props) {
  const [name, setName] = useState(product?.name ?? '')
  const [price, setPrice] = useState(product ? moneyToInput(product.price_int, settings) : '')
  const [threshold, setThreshold] = useState(String(product?.threshold ?? 5))
  const [initialQty, setInitialQty] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const priceInt = parseMoney(price, settings)
    const thr = Number(threshold)
    const qty = initialQty.trim() === '' ? 0 : Number(initialQty)
    if (!name.trim()) return setError(S.errorNameRequired)
    if (priceInt === null) return setError(S.errorPriceInvalid)
    if (!Number.isInteger(thr) || thr < 0) return setError(S.errorThresholdInvalid)
    if (!product && (!Number.isInteger(qty) || qty < 0)) return setError(S.errorQtyInvalid)

    setSaving(true); setError('')
    try {
      if (product) {
        await editProduct(product.id, { name, priceInt, threshold: thr })
      } else {
        await addProduct(settings.user_id, { name, priceInt, threshold: thr, initialQty: qty })
      }
      onClose()
    } catch (err) {
      console.error(err)
      setError(S.errorSaveFailed)
      setSaving(false)
    }
  }

  return (
    <Modal title={product ? S.editProductTitle : S.addProductTitle} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <label htmlFor="pf-name" style={labelStyle}>{S.labelProductName}</label>
        <input id="pf-name" autoFocus value={name} onChange={e => setName(e.target.value)} style={inputStyle} />

        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="pf-price" style={labelStyle}>{S.labelPrice}</label>
            <input id="pf-price" inputMode="decimal" value={price} onChange={e => setPrice(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="pf-thr" style={labelStyle}>{S.colThreshold}</label>
            <input id="pf-thr" inputMode="numeric" value={threshold} onChange={e => setThreshold(e.target.value)} style={inputStyle} />
          </div>
        </div>

        {!product && (
          <>
            <label htmlFor="pf-qty" style={labelStyle}>{S.labelInitialQty}</label>
            <input id="pf-qty" inputMode="numeric" value={initialQty} onChange={e => setInitialQty(e.target.value)} style={inputStyle} />
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
