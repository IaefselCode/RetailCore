/**
 * Single source of truth for stock status across every view.
 *
 * Rules (applied in order):
 * - Out of Stock: quantity <= 0
 * - Low Stock:    0 < quantity <= minStock
 * - Overstocked:  maxStock > 0 && quantity > maxStock
 * - In Stock:     everything else
 *
 * Overstocked needs `maxStock`; when it isn't provided (or is <= 0, meaning
 * "no overstock limit set" for that product/shop row) the check is skipped.
 */

export type StockStatusKey = "statusOut" | "statusLow" | "statusOver" | "statusIn"

export function stockStatusKey(
  quantity: number,
  minStock: number,
  maxStock = 0
): StockStatusKey {
  if (quantity <= 0) return "statusOut"
  if (quantity <= minStock) return "statusLow"
  if (maxStock > 0 && quantity > maxStock) return "statusOver"
  return "statusIn"
}

export function stockStatusVariant(
  key: StockStatusKey
): "destructive" | "secondary" | "outline" | "default" {
  if (key === "statusOut") return "destructive"
  if (key === "statusLow") return "secondary"
  if (key === "statusOver") return "outline"
  return "default"
}

export function isOutOfStock(quantity: number): boolean {
  return quantity <= 0
}

/** Low stock that still has units on hand (excludes out of stock). */
export function isLowStock(quantity: number, minStock: number): boolean {
  return quantity > 0 && quantity <= minStock
}

/** At or below the reorder level (includes out of stock). */
export function isLowOrOut(quantity: number, minStock: number): boolean {
  return quantity <= minStock
}

/** Quantity above the per-row overstock limit; no limit when maxStock <= 0. */
export function isOverstocked(quantity: number, maxStock: number): boolean {
  return maxStock > 0 && quantity > maxStock
}
