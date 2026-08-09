"use server"

import { prisma } from "@/lib/prisma"
import { getEmployeeContext, getSignedInRole } from "@/lib/auth-utils"

export interface SearchItem {
  id: string
  title: string
  subtitle: string
  href: string
}

export interface SearchGroup {
  type: "products" | "shops" | "employees" | "sales"
  items: SearchItem[]
  /** List-page URL shown in the "view all" row. */
  viewAllHref: string
}

export interface GlobalSearchResults {
  groups: SearchGroup[]
}

const MIN_QUERY_LENGTH = 2
const GROUP_LIMIT = 5

function normalize(query: string): string {
  return query.trim()
}

/**
 * General system search used by the topbar search box.
 *
 * ADMIN searches products, shops, employees, and sales.
 * EMPLOYEE searches only the products and sales of their own shop.
 */
export async function globalSearch(rawQuery: string): Promise<GlobalSearchResults> {
  const query = normalize(rawQuery)
  if (query.length < MIN_QUERY_LENGTH) return { groups: [] }

  const { userId, role } = await getSignedInRole()
  if (!userId) return { groups: [] }

  const contains = { contains: query, mode: "insensitive" as const }
  const groups: SearchGroup[] = []

  if (role === "ADMIN") {
    const [products, shops, employees, sales] = await Promise.all([
      prisma.product.findMany({
        where: { OR: [{ name: contains }, { sku: contains }] },
        take: GROUP_LIMIT,
        orderBy: { name: "asc" },
        include: { category: { select: { name: true } } },
      }),
      prisma.shop.findMany({
        where: { OR: [{ name: contains }, { city: contains }] },
        take: GROUP_LIMIT,
        orderBy: { name: "asc" },
      }),
      prisma.employee.findMany({
        where: {
          OR: [
            { user: { firstName: contains } },
            { user: { lastName: contains } },
            { user: { email: contains } },
          ],
        },
        take: GROUP_LIMIT,
        orderBy: { hireDate: "desc" },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          shop: { select: { name: true } },
        },
      }),
      prisma.sale.findMany({
        where: {
          OR: [{ invoiceNo: contains }, { customerName: contains }],
        },
        take: GROUP_LIMIT,
        orderBy: { createdAt: "desc" },
      }),
    ])

    if (products.length) {
      groups.push({
        type: "products",
        viewAllHref: `/admin/products?search=${encodeURIComponent(query)}`,
        items: products.map((p) => ({
          id: p.id,
          title: p.name,
          subtitle: p.category?.name ? `${p.category.name} · ${p.sku}` : p.sku,
          href: `/admin/products/${p.id}`,
        })),
      })
    }

    if (shops.length) {
      groups.push({
        type: "shops",
        viewAllHref: "/admin/shops",
        items: shops.map((s) => ({
          id: s.id,
          title: s.name,
          subtitle: s.city ?? s.address ?? "",
          href: `/admin/shops/${s.id}`,
        })),
      })
    }

    if (employees.length) {
      groups.push({
        type: "employees",
        viewAllHref: "/admin/employees",
        items: employees.map((e) => ({
          id: e.id,
          title: [e.user.firstName, e.user.lastName].filter(Boolean).join(" ") || e.user.email,
          subtitle: e.user.email,
          href: `/admin/employees/${e.id}`,
        })),
      })
    }

    if (sales.length) {
      groups.push({
        type: "sales",
        viewAllHref: "/admin/sales/history",
        items: sales.map((s) => ({
          id: s.id,
          title: s.invoiceNo,
          subtitle: s.customerName ?? s.status.toLowerCase(),
          href: "/admin/sales/history",
        })),
      })
    }
  } else {
    const ctx = await getEmployeeContext()
    if (!ctx) return { groups: [] }

    const [products, sales] = await Promise.all([
      prisma.product.findMany({
        where: {
          OR: [{ name: contains }, { sku: contains }],
          inventory: { some: { shopId: ctx.shopId } },
        },
        take: GROUP_LIMIT,
        orderBy: { name: "asc" },
        include: { category: { select: { name: true } } },
      }),
      prisma.sale.findMany({
        where: {
          shopId: ctx.shopId,
          OR: [{ invoiceNo: contains }, { customerName: contains }],
        },
        take: GROUP_LIMIT,
        orderBy: { createdAt: "desc" },
      }),
    ])

    if (products.length) {
      groups.push({
        type: "products",
        viewAllHref: "/employee/products",
        items: products.map((p) => ({
          id: p.id,
          title: p.name,
          subtitle: p.category?.name ? `${p.category.name} · ${p.sku}` : p.sku,
          href: "/employee/products",
        })),
      })
    }

    if (sales.length) {
      groups.push({
        type: "sales",
        viewAllHref: "/employee/sales-history",
        items: sales.map((s) => ({
          id: s.id,
          title: s.invoiceNo,
          subtitle: s.customerName ?? s.status.toLowerCase(),
          href: "/employee/sales-history",
        })),
      })
    }
  }

  return { groups }
}
