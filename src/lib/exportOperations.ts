import { db } from './db'
import { formatSaleNumber } from './formatCurrency'
import type { ShopSettings } from '../types'

// Builds one CSV "ledger" of every operation in a period: sales (one row per item sold)
// and stock movements (initial stock, restocks, adjustments), oldest first.

const HEADER = ['Date', 'Type', 'Sale #', 'Product', 'Quantity', 'Unit price', 'Amount', 'Customer', 'Reason']

/** Excel in many locales (comma as decimal mark) expects ";" as the column separator. */
export function detectDelimiter(): ',' | ';' {
  return (1.1).toLocaleString().includes(',') ? ';' : ','
}

function pad(n: number) { return String(n).padStart(2, '0') }
function stamp(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Local-time start of "YYYY-MM-DD" and end of that day. */
function dayStart(ymd: string) { const [y, m, d] = ymd.split('-').map(Number); return new Date(y, m - 1, d, 0, 0, 0, 0) }
function dayEnd(ymd: string) { const [y, m, d] = ymd.split('-').map(Number); return new Date(y, m - 1, d, 23, 59, 59, 999) }

export interface OperationsExport {
  csv: string
  salesCount: number
  movementsCount: number
}

export async function buildOperationsCsv(
  shop: Pick<ShopSettings, 'user_id' | 'decimal_places'>,
  fromYmd: string,
  toYmd: string,
  delimiter: ',' | ';' = detectDelimiter()
): Promise<OperationsExport> {
  const from = dayStart(fromYmd).toISOString()
  const to = dayEnd(toYmd).toISOString()
  const inRange = (iso: string) => iso >= from && iso <= to

  const [allSales, allItems, allMovements, products] = await Promise.all([
    db.sales.where('user_id').equals(shop.user_id).toArray(),
    db.sale_items.where('user_id').equals(shop.user_id).toArray(),
    db.stock_movements.where('user_id').equals(shop.user_id).toArray(),
    db.products.where('user_id').equals(shop.user_id).toArray(),
  ])
  const sales = allSales.filter(s => inRange(s.completed_at))
  const movements = allMovements.filter(m => inRange(m.created_at))
  const saleById = new Map(sales.map(s => [s.id, s]))
  const productName = new Map(products.map(p => [p.id, p.name]))

  const divisor = shop.decimal_places === 2 ? 100 : 1
  const money = (int: number) => {
    const v = (int / divisor).toFixed(shop.decimal_places)
    return delimiter === ';' ? v.replace('.', ',') : v
  }

  // text cells: quote when needed, and neutralise spreadsheet formulas typed by users
  const text = (v: string) => {
    let s = v
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s
    return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }

  type Row = { at: string; cells: string[] }
  const rows: Row[] = []

  for (const item of allItems) {
    const sale = saleById.get(item.sale_id)
    if (!sale) continue
    rows.push({
      at: sale.completed_at,
      cells: [
        stamp(sale.completed_at), 'SALE', formatSaleNumber(sale.sale_number), text(item.product_name_snapshot),
        String(-item.quantity), money(item.unit_price_int_snapshot), money(item.line_total_int),
        text(sale.customer_name ?? ''), '',
      ],
    })
  }
  for (const m of movements) {
    const type = m.type.toUpperCase()
    rows.push({
      at: m.created_at,
      cells: [
        stamp(m.created_at), type, '', text(productName.get(m.product_id) ?? ''),
        String(m.quantity),
        m.purchase_price_int !== undefined ? money(m.purchase_price_int) : '',
        m.purchase_price_int !== undefined ? money(m.purchase_price_int * Math.abs(m.quantity)) : '',
        '', text(m.reason ?? ''),
      ],
    })
  }

  rows.sort((a, b) => a.at.localeCompare(b.at))
  const lines = [HEADER.join(delimiter), ...rows.map(r => r.cells.join(delimiter))]
  return { csv: lines.join('\r\n'), salesCount: sales.length, movementsCount: movements.length }
}

/** Triggers a file download in the browser (works offline). BOM so Excel reads UTF-8 correctly. */
export function downloadCsv(csv: string, filename: string) {
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
