import { useState } from 'react'
import { useProducts } from '../hooks/useProducts'
import { useShopSettings } from '../hooks/useShopSettings'
import { useSaleCart } from '../hooks/useSaleCart'
import { completeSale } from '../lib/completeSale'
import { usePrint } from '../lib/printContext'
import { db } from '../lib/db'
import { S } from '../lib/strings'
import ProductGrid from '../components/pos/ProductGrid'
import ReceiptStrip from '../components/pos/ReceiptStrip'
import PostCheckoutPrompt from '../components/pos/PostCheckoutPrompt'

export default function POSPage() {
  // Get userId from Dexie (shop_settings row)
  const [userId, setUserId] = useState<string | undefined>(undefined)

  // Lazy-load userId once on mount
  useState(() => {
    db.shop_settings.toArray().then(rows => {
      if (rows[0]) setUserId(rows[0].user_id)
    })
  })

  const settings = useShopSettings(userId)
  const products = useProducts(userId)
  const [cart, actions] = useSaleCart()

  const { setLastCompletedSale, lastCompletedSale } = usePrint()
  const [showPrompt, setShowPrompt] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)
  const [error, setError] = useState('')

  const saleNumber = settings ? settings.last_sale_number + 1 : 1

  async function handleCheckout() {
    if (!userId || !settings || cart.lines.length === 0) return
    setCheckingOut(true)
    setError('')
    try {
      const completed = await completeSale(userId, cart.lines, cart.customerName)
      setLastCompletedSale(completed)
      actions.clearCart()
      setShowPrompt(true)
    } catch (e) {
      console.error(e)
      setError('Checkout failed. Please try again.')
    } finally {
      setCheckingOut(false)
    }
  }

  function handleDismissPrompt() {
    setShowPrompt(false)
    // Keep lastCompletedSale populated until next checkout so print still works
  }

  if (!settings) {
    return <div style={{ padding: '2rem' }}>{S.loading}</div>
  }

  // Page header: date + time
  const now = new Date()
  const dateStr = now.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long' })
  const timeStr = now.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px 24px 0', boxSizing: 'border-box', overflow: 'hidden' }}>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
        <h1 style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: '26px', margin: 0 }}>
          {S.posTitle}
        </h1>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', opacity: 0.6 }}>
          {dateStr} · {timeStr}
        </span>
      </div>

      {error && (
        <div style={{ marginBottom: '12px', color: '#B3362B', fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px' }}>
          {error}
        </div>
      )}

      {/* Main layout: grid + receipt */}
      <div style={{ display: 'flex', gap: '24px', flex: 1, minHeight: 0, paddingBottom: '20px', overflow: 'hidden' }}>
        {/* Product grid */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <ProductGrid
            products={products}
            settings={settings}
            onTap={actions.addProduct}
          />
        </div>

        {/* Receipt strip */}
        <ReceiptStrip
          lines={cart.lines}
          totalInt={cart.totalInt}
          totalItems={cart.totalItems}
          customerName={cart.customerName}
          saleNumber={saleNumber}
          shopName={settings.shop_name}
          settings={settings}
          onIncrement={actions.increment}
          onDecrement={actions.decrement}
          onCustomerName={actions.setCustomerName}
          onCheckout={handleCheckout}
          onClear={actions.clearCart}
          checkoutDisabled={cart.lines.length === 0 || checkingOut}
        />
      </div>

      {/* Post-checkout prompt */}
      {showPrompt && <PostCheckoutPrompt data={lastCompletedSale} onDismiss={handleDismissPrompt} />}
    </div>
  )
}
