import { formatCurrency, formatSaleNumber } from './formatCurrency'
import type { ReceiptData } from './printReceipt'
import type { Sale, SaleItem, ShopSettings } from '../types'

/** Builds the data printReceipt() needs from a stored sale (uses the price snapshots). */
export function buildReceiptData(sale: Sale, items: SaleItem[], shop: ShopSettings): ReceiptData {
  return {
    shopName: shop.shop_name,
    contact: shop.contact || undefined,
    saleNumber: formatSaleNumber(sale.sale_number),
    dateTime: new Date(sale.completed_at).toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short' }),
    customerName: sale.customer_name || undefined,
    lines: items.map(i => ({
      name: i.product_name_snapshot,
      qty: i.quantity,
      unitPrice: formatCurrency(i.unit_price_int_snapshot, shop),
      lineTotal: formatCurrency(i.line_total_int, shop),
    })),
    itemsCount: items.reduce((n, i) => n + i.quantity, 0),
    total: formatCurrency(sale.total_int, shop),
  }
}
