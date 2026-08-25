"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getEmployeeContext, getSignedInRole } from "@/lib/auth-utils"
import { getRequestMeta, type ActionResult } from "@/lib/actions"
import { logAuditEvent } from "@/lib/audit-log"
import { nextInvoiceNo } from "@/lib/invoice"
import { notifyAdmins, checkAndNotifyStockHealth } from "@/lib/notification-actions"
import { toDecimalString } from "@/lib/money"
import ExcelJS from "exceljs"

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
    const total = subtotal - appliedDiscount
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
          tax: toDecimalString(0),
          discount: toDecimalString(appliedDiscount),
          total: toDecimalString(total),
          // Goods-level profit snapshot (revenue = subtotal, cost = COGS).
          totalCost: toDecimalString(totalCost),
          totalProfit: toDecimalString(subtotal - totalCost - appliedDiscount),
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

    // --- Notification triggers ------------------------------------------------
    // 1. Stock health: out of stock / low / overstocked
    await checkAndNotifyStockHealth(ctx.shopId, lineItems.map((l) => l.productId))

    // 2. Every sale → notify admin
    const employeeName = (ctx.firstName + " " + ctx.lastName).trim()
    const discountNote = appliedDiscount > 0 ? " (discount: " + formatSaleTotal(appliedDiscount) + ")" : ""
    await notifyAdmins({
      title: appliedDiscount > 0 ? "Sale with discount recorded" : "New sale recorded",
      message: "Invoice " + invoiceNo + " — " + formatSaleTotal(total) + " at " + ctx.shopName + (employeeName ? " by " + employeeName : "") + discountNote,
      type: "sales",
    })

    // 3. High-value sale alert (>= 500,000 TZS)
    if (total >= 500_000) {
      await notifyAdmins({
        title: "High-value sale",
        message: "Invoice " + invoiceNo + " — " + formatSaleTotal(total) + " at " + ctx.shopName,
        type: "sales",
      })
    }
    // --------------------------------------------------------------------------

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
      include: { items: true, shop: { select: { name: true } } },
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

    // Notify admins about the refund
    await notifyAdmins({
      title: "Sale refunded",
      message: "Invoice " + sale.invoiceNo + " (" + formatSaleTotal(Number(sale.total)) + ") at " + sale.shop.name + " has been voided",
      type: "operational",
    })

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
  locale?: string
}): Promise<string> {
  const { userId, role } = await getSignedInRole()
  if (!userId || role !== "ADMIN") return ""
  const locale = filters.locale || "en"

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

  // Localized headers
  const isSw = locale === "sw"
  const headers = isSw
    ? ["Ankara", "Tarehe", "Duka", "Mfanyakazi", "Mteja", "Vitu", "Mapato", "Gharama", "Faida", "Punguzo", "Jumla", "Malipo", "Hali"]
    : ["Invoice", "Date", "Shop", "Employee", "Customer", "Items", "Revenue", "Cost", "Profit", "Discount", "Total", "Payment", "Status"]

  // Theme colors
  const PRIMARY = "4F46E5"
  const WHITE = "FFFFFF"
  const LIGHT_BG = "F1F5F9"
  const SECTION_BG = "059669"

  const wb = new ExcelJS.Workbook()
  wb.creator = "RetailCore"
  wb.created = new Date()

  const ws = wb.addWorksheet(isSw ? "Historia ya Mauzo" : "Sales History")

  // Title row
  const now = new Date()
  const dateStr = now.toLocaleDateString(isSw ? "sw-TZ" : "en-US", { year: "numeric", month: "long", day: "numeric" })
  ws.mergeCells(1, 1, 1, headers.length)
  const titleCell = ws.getCell(1, 1)
  titleCell.value = `${isSw ? "Historia ya Mauzo" : "Sales History"} — ${dateStr}`
  titleCell.font = { bold: true, size: 14, color: { argb: `FF${PRIMARY}` } } as ExcelJS.Font
  titleCell.alignment = { vertical: "middle" }
  ws.getRow(1).height = 30

  // Header row
  headers.forEach((h, ci) => {
    const cell = ws.getCell(2, ci + 1)
    cell.value = h
    cell.font = { bold: true, color: { argb: `FF${WHITE}` }, size: 11 } as ExcelJS.Font
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${PRIMARY}` } }
    cell.alignment = { horizontal: "center", vertical: "middle" }
    cell.border = {
      top: { style: "thin" as const, color: { argb: "FFCBD5E1" } },
      left: { style: "thin" as const, color: { argb: "FFCBD5E1" } },
      bottom: { style: "thin" as const, color: { argb: "FFCBD5E1" } },
      right: { style: "thin" as const, color: { argb: "FFCBD5E1" } },
    }
  })
  ws.getRow(2).height = 24

  // Data rows
  sales.forEach((s, i) => {
    const itemCount = s.items.reduce((sum, item) => sum + item.quantity, 0)
    const employee = s.employee
      ? `${s.employee.user.firstName ?? ""} ${s.employee.user.lastName ?? ""}`.trim()
      : ""
    const rowNum = i + 3
    const rowValues = [
      s.invoiceNo,
      s.createdAt.toISOString().slice(0, 10),
      s.shop.name,
      employee,
      s.customerName ?? "",
      itemCount,
      Number(s.subtotal),
      Number(s.totalCost),
      Number(s.totalProfit),
      Number(s.discount),
      Number(s.total),
      s.paymentMethod ?? "",
      s.status,
    ]
    rowValues.forEach((v, ci) => {
      const cell = ws.getCell(rowNum, ci + 1)
      cell.value = v
      cell.border = {
        top: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
        left: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
        right: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
      }
      // Alternate row shading
      if (i % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${LIGHT_BG}` } }
      }
      // Right-align numeric columns (7-12)
      if (ci >= 6 && ci <= 11) {
        cell.numFmt = "#,##0"
        cell.alignment = { horizontal: "right" }
      }
    })
  })

  // Auto-fit column widths
  for (let ci = 1; ci <= headers.length; ci++) {
    let maxLen = headers[ci - 1].length + 3
    const col = ws.getColumn(ci)
    col.eachCell({ includeEmpty: false }, function (cell) {
      const len = String(cell.value ?? "").length
      if (len > maxLen) maxLen = len
    })
    col.width = Math.min(maxLen + 3, 35)
  }

  // Return as base64
  const buf = await wb.xlsx.writeBuffer()
  return Buffer.from(buf).toString("base64")
}
