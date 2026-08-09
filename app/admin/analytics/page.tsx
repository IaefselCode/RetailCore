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
        id: true,
        subtotal: true,
        totalCost: true,
        totalProfit: true,
        status: true,
        createdAt: true,
        shopId: true,
        employee: {
          select: {
            id: true,
            user: { select: { firstName: true, lastName: true } },
            shop: { select: { name: true } },
          },
        },
      },
    }),
    prisma.saleItem.findMany({
      where: { sale: { status: "COMPLETED", createdAt: { gte: start } } },
      select: {
        quantity: true,
        subtotal: true,
        profit: true,
        product: { select: { name: true } },
        sale: { select: { createdAt: true, shopId: true, employeeId: true } },
      },
    }),
    prisma.shop.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  const completedSales = sales.filter((s) => s.status === "COMPLETED")
  const shopNames = new Map(shops.map((s) => [s.id, s.name]))

  // Per-day revenue + cost + profit + orders + units (drives the trend chart).
  // Financial values come from Sale/SaleItem price snapshots so historical
  // periods stay correct even if product prices changed later (spec §11, §96).
  const dayBuckets = new Map<string, { revenue: number; cost: number; profit: number; orders: number; units: number }>()

  // Per-day × per-shop aggregates (drives Sales by Shop).
  const dayShopBuckets = new Map<
    string,
    Map<
      string,
      { shopId: string; shopName: string; revenue: number; cost: number; profit: number; orders: number; units: number }
    >
  >()

  // Per-day × per-employee aggregates (drives Employee Performance).
  const dayEmployeeBuckets = new Map<
    string,
    Map<
      string,
      { employeeId: string; name: string; shopName: string; revenue: number; profit: number; orders: number; units: number }
    >
  >()

  for (const s of completedSales) {
    const key = dayKey(s.createdAt)

    const bucket = dayBuckets.get(key) ?? { revenue: 0, cost: 0, profit: 0, orders: 0, units: 0 }
    bucket.revenue += Number(s.subtotal)
    bucket.cost += Number(s.totalCost)
    bucket.profit += Number(s.totalProfit)
    bucket.orders += 1
    dayBuckets.set(key, bucket)

    let shopDay = dayShopBuckets.get(key)
    if (!shopDay) {
      shopDay = new Map()
      dayShopBuckets.set(key, shopDay)
    }
    const shopEntry =
      shopDay.get(s.shopId) ??
      {
        shopId: s.shopId,
        shopName: shopNames.get(s.shopId) ?? "Unknown",
        revenue: 0,
        cost: 0,
        profit: 0,
        orders: 0,
        units: 0,
      }
    shopEntry.revenue += Number(s.subtotal)
    shopEntry.cost += Number(s.totalCost)
    shopEntry.profit += Number(s.totalProfit)
    shopEntry.orders += 1
    shopDay.set(s.shopId, shopEntry)

    if (s.employee) {
      let empDay = dayEmployeeBuckets.get(key)
      if (!empDay) {
        empDay = new Map()
        dayEmployeeBuckets.set(key, empDay)
      }
      const empEntry =
        empDay.get(s.employee.id) ??
        {
          employeeId: s.employee.id,
          name: [s.employee.user.firstName, s.employee.user.lastName].filter(Boolean).join(" ") || "Unknown",
          shopName: s.employee.shop?.name ?? shopNames.get(s.shopId) ?? "Unknown",
          revenue: 0,
          profit: 0,
          orders: 0,
          units: 0,
        }
      empEntry.revenue += Number(s.subtotal)
      empEntry.profit += Number(s.totalProfit)
      empEntry.orders += 1
      empDay.set(s.employee.id, empEntry)
    }
  }

  // Units are only known from line items, so attribute them per day to the
  // global, shop, and employee buckets in a second pass over the items.
  for (const item of saleItems) {
    const key = dayKey(item.sale.createdAt)

    const bucket = dayBuckets.get(key)
    if (bucket) bucket.units += item.quantity

    const shopEntry = dayShopBuckets.get(key)?.get(item.sale.shopId)
    if (shopEntry) shopEntry.units += item.quantity

    if (item.sale.employeeId) {
      const empEntry = dayEmployeeBuckets.get(key)?.get(item.sale.employeeId)
      if (empEntry) empEntry.units += item.quantity
    }
  }

  const daily: AnalyticsData["daily"] = [...dayBuckets.entries()]
    .map(([date, b]) => ({ date, ...b }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const dailyShops: AnalyticsData["dailyShops"] = [...dayShopBuckets.entries()]
    .flatMap(([date, m]) => [...m.values()].map((v) => ({ date, ...v })))
    .sort((a, b) => a.date.localeCompare(b.date))

  const dailyEmployees: AnalyticsData["dailyEmployees"] = [...dayEmployeeBuckets.entries()]
    .flatMap(([date, m]) => [...m.values()].map((v) => ({ date, ...v })))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Per-day × per-product revenue / profit / units (drives Top Products).
  const dayProductBuckets = new Map<
    string,
    Map<string, { revenue: number; profit: number; units: number }>
  >()
  for (const item of saleItems) {
    const key = dayKey(item.sale.createdAt)
    let productDay = dayProductBuckets.get(key)
    if (!productDay) {
      productDay = new Map()
      dayProductBuckets.set(key, productDay)
    }
    const entry = productDay.get(item.product.name) ?? { revenue: 0, profit: 0, units: 0 }
    entry.revenue += Number(item.subtotal)
    entry.profit += Number(item.profit)
    entry.units += item.quantity
    productDay.set(item.product.name, entry)
  }

  const dailyProducts: AnalyticsData["dailyProducts"] = [...dayProductBuckets.entries()]
    .flatMap(([date, m]) => [...m.entries()].map(([name, v]) => ({ date, name, ...v })))
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    daily,
    dailyShops,
    dailyEmployees,
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
