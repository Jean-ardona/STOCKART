import { useState, useCallback } from 'react'
import type { Product } from '../types'

export interface CartLine {
  productId: string
  productName: string       // snapshot at add time
  unitPriceInt: number      // snapshot at add time
  quantity: number
  maxStock: number          // current stock at add time, for + button cap
}

interface CartState {
  lines: CartLine[]
  totalInt: number
  totalItems: number
  customerName: string
}

interface CartActions {
  addProduct: (product: Product) => void
  increment: (productId: string) => void
  decrement: (productId: string) => void
  setCustomerName: (name: string) => void
  clearCart: () => void
}

function computeTotals(lines: CartLine[]) {
  return {
    totalInt: lines.reduce((sum, l) => sum + l.unitPriceInt * l.quantity, 0),
    totalItems: lines.reduce((sum, l) => sum + l.quantity, 0),
  }
}

export function useSaleCart(): [CartState, CartActions] {
  const [lines, setLines] = useState<CartLine[]>([])
  const [customerName, setCustomerName] = useState('')

  const addProduct = useCallback((product: Product) => {
    setLines(prev => {
      const existing = prev.find(l => l.productId === product.id)
      if (existing) {
        // Already on receipt — increment if below stock cap
        if (existing.quantity >= existing.maxStock) return prev
        return prev.map(l =>
          l.productId === product.id ? { ...l, quantity: l.quantity + 1 } : l
        )
      }
      if (product.stock <= 0) return prev
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          unitPriceInt: product.price_int,
          quantity: 1,
          maxStock: product.stock,
        },
      ]
    })
  }, [])

  const increment = useCallback((productId: string) => {
    setLines(prev =>
      prev.map(l =>
        l.productId === productId && l.quantity < l.maxStock
          ? { ...l, quantity: l.quantity + 1 }
          : l
      )
    )
  }, [])

  const decrement = useCallback((productId: string) => {
    setLines(prev =>
      prev
        .map(l =>
          l.productId === productId ? { ...l, quantity: l.quantity - 1 } : l
        )
        .filter(l => l.quantity > 0)
    )
  }, [])

  const clearCart = useCallback(() => {
    setLines([])
    setCustomerName('')
  }, [])

  const { totalInt, totalItems } = computeTotals(lines)

  return [
    { lines, totalInt, totalItems, customerName },
    { addProduct, increment, decrement, setCustomerName: (n) => setCustomerName(n), clearCart },
  ]
}
