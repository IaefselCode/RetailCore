"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getEmployeeContext, getSignedInRole } from "@/lib/auth-utils"
import { getRequestMeta, type ActionResult } from "@/lib/actions"
import { logAuditEvent } from "@/lib/audit-log"
import { nextInvoiceNo } from "@/lib/invoice"
import { toDecimalString } from "@/lib/money"

function fail(message: string): ActionResult {
  return { success: false, message }
}

function str(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim()
}

type CartItem = { productId: string; quantity: number }

function parseCart(raw: string): CartItem[] | null {
  try {
    const parsed = JSON.parse(raw) as CartItem[]
    if (!Array.isArray(parsed) || parsed.length === 0) return null
    for (const item of parsed) {
      if (!item.productId || !Number.isInteger(item.quantity) || item.quantity <= 0) return null
    }
    return parsed
  } catch {
    return null
  }
}

const TAX_RATE = 0.18

export async function recordSale(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const ctx = await getEmployeeContext()
  if (!ctx) return fail("You do not have permission to do that.")

  try {
    const cart = parseCart(str(formData.get("items")))
    const paymentMethod = str(formData.get("paymentMethod")) || "CASH"
    const customerName = str(formData.get("customerName")) || null
    const customerEmail = str(formData.get("customerEmail")) || null
    const discountRaw = str(formData.get("discount"))
    const discount = discountRaw ? parseFloat(discountRaw) : 0

    if (!cart) return fail("Add at least one item to the cart.")
    if (Number.isNaN(discount) || discount < 0) return fail("Enter a valid discount.")

    const products = await prisma.product.findMany({
      where: { id: { in: cart.map((c) => c.productId) }, isActive: true },
      include: {
        inventory: { where: { shopId: ctx.shopId }, select: { quantity: true } },
      },
    })

    if (products.length !== cart.length) return fail("One or more products are unavailable.")

    let subtotal = 0
    let totalCost = 0
    const lineItems: {
      productId: string
      name: string
      quantity: number
      unitPrice: number
      unitCostPrice: number
      subtotal: number
      totalCost: number
      profit: number
    }[] = []

    for (const item of cart) {
      const product = products.find((p) => p.id === item.productId)!
      const stock = product.inventory[0]?.quantity ?? 0
      if (stock < item.quantity) {
        return fail(`Insufficient stock for ${product.name} (${stock} available).`)
      }
      // Backend-authoritative price snapshot (spec §11, §82-83): the client
      // only sends productId + quantity; prices/profit come from here.
      const unitPrice = Number(product.price)
      const unitCostPrice = Number(product.cost) || 0
      const lineSubtotal = unitPrice * item.quantity
      const lineCost = unitCostPrice * item.quantity
      subtotal += lineSubtotal
      totalCost += lineCost
      lineItems.push({
        productId: product.id,
        name: product.name,
        quantity: item.quantity,
        unitPrice,
        unitCostPrice,
        subtotal: lineSubtotal,
        totalCost: lineCost,
        profit: lineSubtotal - lineCost,
      })
    }

    const appliedDiscount = Math.min(discount, subtotal)
    const taxable = subtotal - appliedDiscount
    const tax = Math.round(taxable * TAX_RATE * 100) / 100
    const total = taxable + tax
    const invoiceNo = await nextInvoiceNo()

    await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          invoiceNo,
          employeeId: ctx.employeeId,
          shopId: ctx.shopId,
          customerName,
          customerEmail,
          subtotal: toDecimalString(subtotal),
          tax: toDecimalString(tax),
          discount: toDecimalString(appliedDiscount),
          total: toDecimalString(total),
          // Goods-level profit snapshot (revenue = subtotal, cost = COGS).
          totalCost: toDecimalString(totalCost),
          totalProfit: toDecimalString(subtotal - totalCost),
          paymentMethod,
          status: "COMPLETED",
        },
      })

      for (const item of lineItems) {
        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: toDecimalString(item.unitPrice),
            subtotal: toDecimalString(item.subtotal),
            unitCostPrice: toDecimalString(item.unitCostPrice),
            totalCost: toDecimalString(item.totalCost),
            profit: toDecimalString(item.profit),
          },
        })

        // Check-and-decrement inside the transaction: if a concurrent sale
        // already consumed the stock, count === 0 and this sale rolls back
        // (spec §29-30 — inventory can never go negative).
        const guard = await tx.inventory.updateMany({
          where: { productId: item.productId, shopId: ctx.shopId, quantity: { gte: item.quantity } },
          data: { quantity: { decrement: item.quantity } },
        })
        if (guard.count === 0) {
          throw new Error(`Insufficient stock for ${item.name} at sale time.`)
        }

        // Inventory movement history (spec §17-19, §27).
        await tx.stockTransaction.create({
          data: {
            type: "SALE",
            productId: item.productId,
            shopId: ctx.shopId,
            quantity: -item.quantity,
            reference: invoiceNo,
            notes: `Sale ${invoiceNo}`,
          },
        })
      }
    })

    const meta = await getRequestMeta()
    await logAuditEvent("sale_recorded", {
      actorId: ctx.userId,
      entityType: "Sale",
      entityId: invoiceNo,
      detail: `${formatSaleTotal(total)} via ${paymentMethod}`,
      ip: meta.ip,
    })

    revalidatePath("/employee/record-sale")
    revalidatePath("/employee/sales-history")
    revalidatePath("/employee/inventory")
    revalidatePath("/employee/products")
    revalidatePath("/admin/sales")
    revalidatePath("/admin/sales/history")

    return {
      success: true,
      message: `Sale completed! Invoice ${invoiceNo} — ${formatSaleTotal(total)}`,
    }
  } catch (err) {
    console.error("recordSale failed:", err)
    return fail("Something went wrong. Please try again.")
  }
}

function formatSaleTotal(total: number): string {
  return total.toLocaleString("en-US", { style: "currency", currency: "USD" })
}

export async function refundSale(formData: FormData): Promise<ActionResult> {
  const { userId, role } = await getSignedInRole()
  if (!userId || role !== "ADMIN") return fail("You do not have permission to do that.")

  try {
    const saleId = str(formData.get("saleId"))
    if (!saleId) return fail("Missing sale id.")

    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { items: true },
    })
    if (!sale) return fail("Sale not found.")
    if (sale.status === "VOIDED") return fail("Sale is already voided.")
    if (sale.status !== "COMPLETED") return fail("Only completed sales can be voided.")

    await prisma.$transaction(async (tx) => {
      await tx.sale.update({
        where: { id: saleId },
        data: { status: "VOIDED" },
      })

      for (const item of sale.items) {
        await tx.inventory.upsert({
          where: {
            productId_shopId: { productId: item.productId, shopId: sale.shopId },
          },
          create: {
            productId: item.productId,
            shopId: sale.shopId,
            quantity: item.quantity,
          },
          update: { quantity: { increment: item.quantity } },
        })

        // Reversal movement (spec §34-35): the original SALE movement stays,
        // the reversal explains how stock came back.
        await tx.stockTransaction.create({
          data: {
            type: "SALE_REVERSAL",
            productId: item.productId,
            shopId: sale.shopId,
            quantity: item.quantity,
            reference: sale.invoiceNo,
            notes: `Void ${sale.invoiceNo}`,
          },
        })
      }
    })

    const meta = await getRequestMeta()
    await logAuditEvent("sale_voided", {
      actorId: userId,
      entityType: "Sale",
      entityId: sale.id,
      detail: sale.invoiceNo,
      ip: meta.ip,
    })

    revalidatePath("/admin/sales")
    revalidatePath("/admin/sales/history")
    revalidatePath("/employee/sales-history")
    revalidatePath("/employee/inventory")
    return { success: true, message: `Sale ${sale.invoiceNo} voided.` }
  } catch (err) {
    console.error("refundSale failed:", err)
    return fail("Something went wrong. Please try again.")
  }
}

export async function getCsvExport(filters: {
  dateFrom?: string
  dateTo?: string
  paymentMethod?: string
  status?: string
  shopId?: string
}): Promise<string> {
  const { userId, role } = await getSignedInRole()
  if (!userId || role !== "ADMIN") return ""

  const where: Record<string, unknown> = {}
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: new Date(`${filters.dateTo}T23:59:59`) } : {}),
    }
  }
  if (filters.paymentMethod && filters.paymentMethod !== "all") {
    where.paymentMethod = filters.paymentMethod
  }
  if (filters.status && filters.status !== "all") {
    where.status = filters.status.toUpperCase()
  }
  if (filters.shopId && filters.shopId !== "all") {
    where.shopId = filters.shopId
  }

  const sales = await prisma.sale.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      shop: { select: { name: true } },
      employee: { include: { user: { select: { firstName: true, lastName: true } } } },
      items: { select: { quantity: true } },
    },
  })

  const header = "Invoice,Date,Shop,Employee,Customer,Items,Revenue,Cost,Profit,Tax,Discount,Total,Payment,Status"
  const rows = sales.map((s) => {
    const itemCount = s.items.reduce((sum, i) => sum + i.quantity, 0)
    const employee = s.employee
      ? `${s.employee.user.firstName ?? ""} ${s.employee.user.lastName ?? ""}`.trim()
      : ""
    return [
      s.invoiceNo,
      s.createdAt.toISOString(),
      s.shop.name,
      employee,
      s.customerName ?? "",
      itemCount,
      Number(s.subtotal),
      Number(s.totalCost),
      Number(s.totalProfit),
      Number(s.tax),
      Number(s.discount),
      Number(s.total),
      s.paymentMethod ?? "",
      s.status,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  })

  return [header, ...rows].join("\n")
}
