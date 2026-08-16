import { stockStatusKey, type StockStatusKey } from "@/lib/stock-status"

/** Minimal inventory shape (with product + shop context) this helper accepts. */
export interface StockHealthRow {
  id: string
  shopId: string
  quantity: number
  minStock: number
  maxStock: number
  product: { name: string; sku: string }
  shop: { id: string; name: string }
}

export interface StockHealthItem {
  id: string
  productName: string
  sku: string
  shopId: string
  shopName: string
  quantity: number
  minStock: number
  maxStock: number
  statusKey: StockStatusKey
}

export interface ShopStockHealth {
  shopId: string
  shopName: string
  out: number
  low: number
  over: number
  healthy: number
  total: number
}

export interface StockHealthSummary {
  perShop: ShopStockHealth[]
  totals: { out: number; low: number; over: number; healthy: number; total: number }
  byStatus: {
    out: StockHealthItem[]
    low: StockHealthItem[]
    over: StockHealthItem[]
  }
}

/**
 * Groups inventory rows by the shared stock-status rule (out / low / over /
 * healthy) and aggregates counts per shop. Healthy = in stock and not over
 * the per-row maxStock limit.
 */
export function buildStockHealth(rows: StockHealthRow[]): StockHealthSummary {
  const byShop = new Map<string, ShopStockHealth>()
  const byStatus: StockHealthSummary["byStatus"] = { out: [], low: [], over: [] }

  for (const row of rows) {
    const key = stockStatusKey(row.quantity, row.minStock, row.maxStock)

    const entry = byShop.get(row.shopId) ?? {
      shopId: row.shopId,
      shopName: row.shop.name,
      out: 0,
      low: 0,
      over: 0,
      healthy: 0,
      total: 0,
    }
    entry.total++
    if (key === "statusOut") entry.out++
    else if (key === "statusLow") entry.low++
    else if (key === "statusOver") entry.over++
    else entry.healthy++
    byShop.set(row.shopId, entry)

    if (key !== "statusIn") {
      const group =
        key === "statusOut" ? byStatus.out : key === "statusLow" ? byStatus.low : byStatus.over
      group.push({
        id: row.id,
        productName: row.product.name,
        sku: row.product.sku,
        shopId: row.shopId,
        shopName: row.shop.name,
        quantity: row.quantity,
        minStock: row.minStock,
        maxStock: row.maxStock,
        statusKey: key,
      })
    }
  }

  for (const list of Object.values(byStatus)) {
    list.sort(
      (a, b) =>
        a.shopName.localeCompare(b.shopName) || a.productName.localeCompare(b.productName)
    )
  }

  const perShop = [...byShop.values()].sort((a, b) => a.shopName.localeCompare(b.shopName))
  const totals = perShop.reduce(
    (acc, r) => ({
      out: acc.out + r.out,
      low: acc.low + r.low,
      over: acc.over + r.over,
      healthy: acc.healthy + r.healthy,
      total: acc.total + r.total,
    }),
    { out: 0, low: 0, over: 0, healthy: 0, total: 0 }
  )

  return { perShop, totals, byStatus }
}
