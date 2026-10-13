import type { ShopSettings } from '../types'

type Fmt = Pick<ShopSettings, 'decimal_places'>

/** "12.50" → 1250 (or "1500" → 1500 when decimal_places is 0). Returns null if invalid. */
export function parseMoney(input: string, settings: Fmt): number | null {
  const cleaned = input.trim().replace(',', '.')
  if (cleaned === '' || !/^\d+(\.\d+)?$/.test(cleaned)) return null
  const factor = settings.decimal_places === 2 ? 100 : 1
  return Math.round(parseFloat(cleaned) * factor)
}

/** 1250 → "12.50" for an input field. */
export function moneyToInput(amountInt: number, settings: Fmt): string {
  return settings.decimal_places === 2 ? (amountInt / 100).toFixed(2) : String(amountInt)
}
