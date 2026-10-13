import type { ShopSettings } from '../types'

/**
 * Format an integer amount (in smallest currency unit) to a display string.
 * e.g. 1050, { currency_code: 'USD', decimal_places: 2 } → "$10.50"
 *      1050, { currency_code: 'XOF', decimal_places: 0 } → "1 050 XOF"
 */
export function formatCurrency(
  amountInt: number,
  settings: Pick<ShopSettings, 'currency_code' | 'decimal_places'>
): string {
  const divisor = settings.decimal_places === 2 ? 100 : 1
  const value = amountInt / divisor

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: settings.currency_code,
      minimumFractionDigits: settings.decimal_places,
      maximumFractionDigits: settings.decimal_places,
    }).format(value)
  } catch {
    // Fallback if currency code is invalid
    const fixed = value.toFixed(settings.decimal_places)
    return `${fixed} ${settings.currency_code}`
  }
}

/** Format sale number as #0001 */
export function formatSaleNumber(n: number): string {
  return `#${String(n).padStart(4, '0')}`
}
