import { createContext, useContext, useState } from 'react'
import type { CompletedSaleData } from '../types'

interface PrintContextValue {
  lastCompletedSale: CompletedSaleData | null
  setLastCompletedSale: (data: CompletedSaleData | null) => void
}

const PrintContext = createContext<PrintContextValue>({
  lastCompletedSale: null,
  setLastCompletedSale: () => {},
})

export function PrintProvider({ children }: { children: React.ReactNode }) {
  const [lastCompletedSale, setLastCompletedSale] = useState<CompletedSaleData | null>(null)
  return (
    <PrintContext.Provider value={{ lastCompletedSale, setLastCompletedSale }}>
      {children}
    </PrintContext.Provider>
  )
}

export function usePrint() {
  return useContext(PrintContext)
}
