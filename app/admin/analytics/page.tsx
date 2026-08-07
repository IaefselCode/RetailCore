import { requireRole } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "next-intl/server"
import {
  AnalyticsContent,
  type AnalyticsData,
  type Granularity,
} from "@/components/admin/analytics-content"

export const metadata = { title: "Analytics | RetailCore" }

interface SearchParams {
  view?: string
}

const GRANULARITIES: Granularity[] = ["daily", "weekly", "monthly", "yearly"]

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`
}

async function loadAnalytics(): Promise<AnalyticsData> {
  const now = new Date()
  // Full window: 5 years of per-day data so the chart can shift between
  // daily / weekly / monthly / yearly granularities.
  const start = new Date(now.getFullYear() - 5, now.getMonth(), 1)
  start.setHours(0, 0, 0, 0)

  const [sales, saleItems, shops] = await Promise.all([
    prisma.sale.findMany({
      where: { createdAt: { gte: start } },
      select: {
        total: true,
        status: true,
        createdAt: true,
        shopId: true,
      },
    }),
    prisma.saleItem.findMany({
      where: { sale: { status: "COMPLETED", createdAt: { gte: start } } },
      select: {
        quantity: true,
        subtotal: true,
        product: { select: { name: true, cost: true } },
        sale: { select: { createdAt: true } },
      },
    }),
    prisma.shop.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  const completedSales = sales.filter((s) => s.status === "COMPLETED")
  const shopNames = new Map(shops.map((s) => [s.id, s.name]))

  // Per-day revenue + cogs + orders (drives the trend chart). cogs is exposed
  // raw so the client can bucket first and floor profit only on the period.
  const dayBuckets = new Map<string, { revenue: number; cogs: number; orders: number }>()

  // Per-day × per-shop revenue + orders (drives Sales by Shop + Top Shop).
  const dayShopBuckets = new Map<
    string,
    Map<string, { shopId: string; shopName: string; revenue: number; orders: number }>
  >()

  for (const s of completedSales) {
    const key = dayKey(s.createdAt)

    const bucket = dayBuckets.get(key) ?? { revenue: 0, cogs: 0, orders: 0 }
    bucket.revenue += Number(s.total)
    bucket.orders += 1
    dayBuckets.set(key, bucket)

    let shopDay = dayShopBuckets.get(key)
    if (!shopDay) {
      shopDay = new Map()
      dayShopBuckets.set(key, shopDay)
    }
    const shopEntry =
      shopDay.get(s.shopId) ??
      { shopId: s.shopId, shopName: shopNames.get(s.shopId) ?? "Unknown", revenue: 0, orders: 0 }
    shopEntry.revenue += Number(s.total)
    shopEntry.orders += 1
    shopDay.set(s.shopId, shopEntry)
  }

  for (const item of saleItems) {
    const bucket = dayBuckets.get(dayKey(item.sale.createdAt))
    if (!bucket) continue
    const cost = item.product.cost ? Number(item.product.cost) : 0
    bucket.cogs += item.quantity * cost
  }

  const daily: AnalyticsData["daily"] = [...dayBuckets.entries()]
    .map(([date, b]) => ({
      date,
      revenue: b.revenue,
      cogs: b.cogs,
      orders: b.orders,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const dailyShops: AnalyticsData["dailyShops"] = [...dayShopBuckets.entries()]
    .flatMap(([date, m]) =>
      [...m.values()].map((v) => ({ date, ...v }))
    )
    .sort((a, b) => a.date.localeCompare(b.date))

  // Per-day × per-product revenue (drives Top Products).
  const dayProductBuckets = new Map<string, Map<string, number>>()
  for (const item of saleItems) {
    const key = dayKey(item.sale.createdAt)
    let productDay = dayProductBuckets.get(key)
    if (!productDay) {
      productDay = new Map()
      dayProductBuckets.set(key, productDay)
    }
    productDay.set(
      item.product.name,
      (productDay.get(item.product.name) ?? 0) + Number(item.subtotal)
    )
  }

  const dailyProducts: AnalyticsData["dailyProducts"] = [...dayProductBuckets.entries()]
    .flatMap(([date, m]) =>
      [...m.entries()].map(([name, revenue]) => ({ date, name, revenue }))
    )
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    daily,
    dailyShops,
    dailyProducts,
    // Earliest date the query covers, so the client can tell "no sales in the
    // previous window" apart from "previous window was never queried" (e.g.
    // the yearly granularity's 5-year-old preceding window).
    dataStart: dayKey(start),
  }
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireRole("ADMIN")
  const t = await getTranslations("analytics")
  const params = await searchParams

  const data = await loadAnalytics()

  const requested = params.view
  const initialView =
    requested && GRANULARITIES.includes(requested as Granularity)
      ? (requested as Granularity)
      : "monthly"

  return (
    <div className="flex flex-col gap-6">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <span>{t("breadcrumb")}</span>
      </nav>
      <AnalyticsContent data={data} initialView={initialView} />
    </div>
  )
}
