"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getSignedInRole } from "@/lib/auth-utils"
import { getRequestMeta, type ActionResult } from "@/lib/actions"
import { logAuditEvent } from "@/lib/audit-log"
import { notifyShopEmployees, checkAndNotifyStockHealth } from "@/lib/notification-actions"

function fail(message: string): ActionResult {
  return { success: false, message }
}

function str(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim()
}

async function requireAdmin() {
  const { userId, role } = await getSignedInRole()
  if (!userId || role !== "ADMIN") return null
  return userId
}

type LineItem = { productId: string; quantity: number; unitCost?: number }

function parseItems(raw: string): LineItem[] | null {
  try {
    const parsed = JSON.parse(raw) as LineItem[]
    if (!Array.isArray(parsed) || parsed.length === 0) return null
    for (const item of parsed) {
      if (!item.productId || !Number.isInteger(item.quantity) || item.quantity <= 0) return null
    }
    return parsed
  } catch {
    return null
  }
}

export async function purchaseStock(formData: FormData): Promise<ActionResult> {
  const actorId = await requireAdmin()
  if (!actorId) return fail("You do not have permission to do that.")

  try {
    const shopId = str(formData.get("shopId"))
    const notes = str(formData.get("notes")) || null
    const reference = str(formData.get("reference")) || null
    const items = parseItems(str(formData.get("items")))

    if (!shopId) return fail("Select a shop.")
    if (!items) return fail("Add at least one product with a valid quantity.")

    const shop = await prisma.shop.findUnique({ where: { id: shopId } })
    if (!shop) return fail("Select a valid shop.")

    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } })
        if (!product) throw new Error("invalid_product")

        if (item.unitCost != null && item.unitCost >= 0) {
          await tx.product.update({
            where: { id: item.productId },
            data: { cost: item.unitCost },
          })
        }

        await tx.inventory.upsert({
          where: { productId_shopId: { productId: item.productId, shopId } },
          create: { productId: item.productId, shopId, quantity: item.quantity },
          update: { quantity: { increment: item.quantity } },
        })

        await tx.stockTransaction.create({
          data: {
            type: "STOCK_IN",
            productId: item.productId,
            shopId,
            quantity: item.quantity,
            reference,
            notes,
          },
        })
      }
    })

    const meta = await getRequestMeta()
    await logAuditEvent("stock_purchased", {
      actorId,
      entityType: "Shop",
      entityId: shopId,
      detail: `${items.length} item(s) at ${shop.name}`,
      ip: meta.ip,
    })

    revalidatePath("/admin/inventory")
    revalidatePath("/employee/inventory")
    revalidatePath("/employee/products")
    revalidatePath("/admin/products")

    // Check stock health for all purchased products at this shop
    await checkAndNotifyStockHealth(shopId, items.map((i) => i.productId))

    return { success: true, message: "Stock purchased successfully." }
  } catch (err) {
    console.error("purchaseStock failed:", err)
    if (err instanceof Error && err.message === "invalid_product") {
      return fail("One or more products are invalid.")
    }
    return fail("Something went wrong. Please try again.")
  }
}

type Distribution = { toShopId: string; quantity: number }

export async function distributeStock(formData: FormData): Promise<ActionResult> {
  const actorId = await requireAdmin()
  if (!actorId) return fail("You do not have permission to do that.")

  try {
    const productId = str(formData.get("productId"))
    const fromShopId = str(formData.get("fromShopId"))
    const notes = str(formData.get("notes")) || null
    let distributions: Distribution[]
    try {
      distributions = JSON.parse(str(formData.get("distributions"))) as Distribution[]
    } catch {
      return fail("Invalid distribution data.")
    }

    if (!productId || !fromShopId) return fail("Select a product and source shop.")
    if (!Array.isArray(distributions) || distributions.length === 0) {
      return fail("Add at least one destination shop.")
    }

    const totalOut = distributions.reduce((sum, d) => sum + d.quantity, 0)
    if (totalOut <= 0) return fail("Enter valid quantities.")

    const source = await prisma.inventory.findUnique({
      where: { productId_shopId: { productId, shopId: fromShopId } },
    })
    if (!source || source.quantity < totalOut) {
      return fail("Insufficient stock at source shop.")
    }
    // NOTE: the authoritative guard repeats inside the transaction, so a
    // concurrent transfer cannot push the source below zero.

    await prisma.$transaction(async (tx) => {
      // Check-and-decrement: reject if a concurrent operation consumed stock.
      const guard = await tx.inventory.updateMany({
        where: { productId, shopId: fromShopId, quantity: { gte: totalOut } },
        data: { quantity: { decrement: totalOut } },
      })
      if (guard.count === 0) throw new Error("insufficient_stock")

      // Source movement (spec §20: TRANSFER_OUT on source, TRANSFER_IN on dest).
      await tx.stockTransaction.create({
        data: {
          type: "TRANSFER_OUT",
          productId,
          shopId: fromShopId,
          quantity: -totalOut,
          reference: distributions.map((d) => d.toShopId).join(","),
          notes,
        },
      })

      for (const dist of distributions) {
        if (dist.quantity <= 0) continue
        if (dist.toShopId === fromShopId) throw new Error("same_shop")

        await tx.inventory.upsert({
          where: { productId_shopId: { productId, shopId: dist.toShopId } },
          create: { productId, shopId: dist.toShopId, quantity: dist.quantity },
          update: { quantity: { increment: dist.quantity } },
        })

        await tx.stockTransaction.create({
          data: {
            type: "TRANSFER_IN",
            productId,
            shopId: dist.toShopId,
            quantity: dist.quantity,
            reference: fromShopId,
            notes,
          },
        })
      }
    })

    const meta = await getRequestMeta()
    await logAuditEvent("stock_distributed", {
      actorId,
      entityType: "Product",
      entityId: productId,
      detail: `${totalOut} units from shop ${fromShopId}`,
      ip: meta.ip,
    })

    revalidatePath("/admin/inventory")
    revalidatePath("/employee/inventory")
    revalidatePath("/employee/products")

    // Notify destination shop employees about incoming stock
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { name: true } })
    const productName = product?.name ?? "Product"
    const fromShop = await prisma.shop.findUnique({ where: { id: fromShopId }, select: { name: true } })
    const fromShopName = fromShop?.name ?? "source shop"
    for (const dist of distributions) {
      if (dist.quantity <= 0) continue
      await notifyShopEmployees(dist.toShopId, {
        title: "Stock received",
        message: productName + " — " + dist.quantity + " units transferred from " + fromShopName,
        type: "system",
      })
    }

    // Stock health checks: source could go low/out, destinations could go over
    await checkAndNotifyStockHealth(fromShopId, [productId])
    for (const dist of distributions) {
      if (dist.quantity > 0) {
        await checkAndNotifyStockHealth(dist.toShopId, [productId])
      }
    }

    return { success: true, message: "Stock distributed successfully." }
  } catch (err) {
    console.error("distributeStock failed:", err)
    if (err instanceof Error && err.message === "same_shop") {
      return fail("Source and destination shops must differ.")
    }
    if (err instanceof Error && err.message === "insufficient_stock") {
      return fail("Insufficient stock at source shop.")
    }
    return fail("Something went wrong. Please try again.")
  }
}
