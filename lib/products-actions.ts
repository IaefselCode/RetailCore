"use server"

import { sanitize } from "@/lib/sanitize"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getSignedInRole } from "@/lib/auth-utils"
import { getRequestMeta, type ActionResult } from "@/lib/actions"
import { logAuditEvent } from "@/lib/audit-log"
import { notifyAdmins } from "@/lib/notification-actions"
import { deleteImage } from "@/lib/images-server"

function fail(message: string): ActionResult {
  return { success: false, message }
}

function str(value: FormDataEntryValue | null): string {
  return sanitize(value)
}

/** Collects shop ids from repeated `shopIds` form entries (and a comma-separated fallback). */
function shopIdsFromForm(formData: FormData): string[] {
  const all = formData.getAll("shopIds")
  const ids = new Set<string>()
  for (const entry of all) {
    const v = String(entry).trim()
    if (!v) continue
    if (v.includes(",")) {
      for (const part of v.split(",")) if (part.trim()) ids.add(part.trim())
    } else {
      ids.add(v)
    }
  }
  return [...ids]
}

async function requireAdmin() {
  const { userId, role } = await getSignedInRole()
  if (!userId || role !== "ADMIN") return null
  return userId
}

export async function createProduct(formData: FormData): Promise<ActionResult> {
  const actorId = await requireAdmin()
  if (!actorId) return fail("You do not have permission to do that.")

  try {
    const name = str(formData.get("name"))
    const sku = str(formData.get("sku"))
    const priceRaw = str(formData.get("price"))
    const costRaw = str(formData.get("cost"))
    const description = str(formData.get("description")) || null
    const imageUrl = str(formData.get("imageUrl")) || null
    let categoryId = str(formData.get("categoryId")) || null
    const newCategory = str(formData.get("newCategory"))

    if (name.length < 2) return fail("Product name is required.")
    if (sku.length < 2) return fail("SKU is required.")

    const price = parseFloat(priceRaw)
    if (isNaN(price) || price < 0) return fail("Enter a valid price.")
    const cost = costRaw ? parseFloat(costRaw) : null
    if (cost !== null && isNaN(cost)) return fail("Enter a valid cost.")

    // Create inline category if provided
    if (newCategory) {
      const cat = await prisma.category.upsert({
        where: { name: newCategory },
        update: {},
        create: { name: newCategory },
      })
      categoryId = cat.id
    }

    const existing = await prisma.product.findUnique({ where: { sku } })
    if (existing) return fail("A product with that SKU already exists.")

    const shopIds = shopIdsFromForm(formData)
    if (shopIds.length === 0) return fail("Assign the product to at least one shop.")

    const product = await prisma.product.create({
      data: {
        name,
        sku,
        description,
        price,
        cost,
        categoryId,
        imageUrl,
        isActive: true,
        inventory: {
          create: shopIds.map((shopId) => ({ shopId, quantity: 0, minStock: 0, maxStock: 0 })),
        },
      },
    })

    const meta = await getRequestMeta()
    await logAuditEvent("product_created", {
      actorId,
      entityType: "Product",
      entityId: product.id,
      detail: `${name} (${sku})`,
      ip: meta.ip,
    })
    revalidatePath("/admin/products")
    revalidatePath("/employee/products")
    await notifyAdmins({ title: "New product added", message: name + " (" + sku + ") has been added to the catalog", type: "system" })
    return { success: true, message: "Product created." }
  } catch (err) {
    console.error("createProduct failed:", err)
    return fail("Something went wrong. Please try again.")
  }
}

export async function updateProduct(formData: FormData): Promise<ActionResult> {
  const actorId = await requireAdmin()
  if (!actorId) return fail("You do not have permission to do that.")

  try {
    const id = str(formData.get("id"))
    const name = str(formData.get("name"))
    const sku = str(formData.get("sku"))
    const priceRaw = str(formData.get("price"))
    const costRaw = str(formData.get("cost"))
    const description = str(formData.get("description")) || null
    const imageUrl = str(formData.get("imageUrl")) || null
    let categoryId = str(formData.get("categoryId")) || null
    const newCategory = str(formData.get("newCategory"))

    if (!id || name.length < 2) return fail("Product name is required.")
    if (sku.length < 2) return fail("SKU is required.")

    const price = parseFloat(priceRaw)
    if (isNaN(price) || price < 0) return fail("Enter a valid price.")
    const cost = costRaw ? parseFloat(costRaw) : null

    if (newCategory) {
      const cat = await prisma.category.upsert({
        where: { name: newCategory },
        update: {},
        create: { name: newCategory },
      })
      categoryId = cat.id
    }

    const skuTaken = await prisma.product.findFirst({ where: { sku, NOT: { id } } })
    if (skuTaken) return fail("A product with that SKU already exists.")

    const existingImage = await prisma.product.findUnique({
      where: { id },
      select: { imageUrl: true },
    })

    const shopIds = shopIdsFromForm(formData)
    if (shopIds.length === 0) return fail("Assign the product to at least one shop.")

    // Reconcile shop assignments. Removing a shop that still holds stock would
    // silently discard that stock, so block it until the stock is moved out.
    const currentRows = await prisma.inventory.findMany({
      where: { productId: id },
      include: { shop: { select: { name: true } } },
    })
    const removedWithStock = currentRows.filter(
      (row) => row.quantity > 0 && !shopIds.includes(row.shopId)
    )
    if (removedWithStock.length > 0) {
      return fail(
        `Cannot remove ${removedWithStock
          .map((r) => r.shop.name)
          .join(", ")} — this product still has stock there. Move the stock out first.`
      )
    }

    const product = await prisma.product.update({
      where: { id },
      data: { name, sku, description, price, cost, categoryId, imageUrl },
    })

    const currentShopIds = currentRows.map((r) => r.shopId)
    const toAdd = shopIds.filter((sid) => !currentShopIds.includes(sid))
    const toRemove = currentRows.filter(
      (row) => !shopIds.includes(row.shopId) && row.quantity === 0
    )
    if (toAdd.length > 0) {
      await prisma.inventory.createMany({
        data: toAdd.map((shopId) => ({
          productId: id,
          shopId,
          quantity: 0,
          minStock: 0,
          maxStock: 0,
        })),
      })
    }
    if (toRemove.length > 0) {
      await prisma.inventory.deleteMany({
        where: { productId: id, shopId: { in: toRemove.map((r) => r.shopId) } },
      })
    }

    // Remove the previous image file if it was replaced with a new one.
    if (existingImage?.imageUrl && existingImage.imageUrl !== imageUrl) {
      await deleteImage(existingImage.imageUrl)
    }

    const meta = await getRequestMeta()
    await logAuditEvent("product_updated", {
      actorId,
      entityType: "Product",
      entityId: product.id,
      detail: `${name} (${sku})`,
      ip: meta.ip,
    })
    revalidatePath("/admin/products")
    revalidatePath(`/admin/products/${id}`)
    revalidatePath("/employee/products")
    return { success: true, message: "Product updated." }
  } catch (err) {
    console.error("updateProduct failed:", err)
    return fail("Something went wrong. Please try again.")
  }
}

export async function toggleProductActive(formData: FormData): Promise<ActionResult> {
  const actorId = await requireAdmin()
  if (!actorId) return fail("You do not have permission to do that.")

  try {
    const id = str(formData.get("id"))
    const active = formData.get("active") === "true"
    if (!id) return fail("Missing product id.")

    const product = await prisma.product.update({
      where: { id },
      data: { isActive: active },
    })

    const meta = await getRequestMeta()
    await logAuditEvent(active ? "product_activated" : "product_deactivated", {
      actorId,
      entityType: "Product",
      entityId: product.id,
      detail: product.name,
      ip: meta.ip,
    })
    revalidatePath("/admin/products")
    revalidatePath("/employee/products")
    return { success: true, message: active ? "Product activated." : "Product deactivated." }
  } catch (err) {
    console.error("toggleProductActive failed:", err)
    return fail("Something went wrong. Please try again.")
  }
}

export async function deleteProduct(formData: FormData): Promise<ActionResult> {
  const actorId = await requireAdmin()
  if (!actorId) return fail("You do not have permission to do that.")

  try {
    const id = str(formData.get("id"))
    if (!id) return fail("Missing product id.")

    const product = await prisma.product.findUnique({
      where: { id },
      include: { _count: { select: { saleItems: true } } },
    })
    if (!product) return fail("Product not found.")
    if (product._count.saleItems > 0) {
      return fail("Cannot delete a product with sales history. Deactivate it instead.")
    }

    await prisma.product.delete({ where: { id } })

    // Remove the product's image file from storage.
    if (product.imageUrl) {
      await deleteImage(product.imageUrl)
    }

    const meta = await getRequestMeta()
    await logAuditEvent("product_deleted", {
      actorId,
      entityType: "Product",
      entityId: id,
      detail: `${product.name} (${product.sku})`,
      ip: meta.ip,
    })
    revalidatePath("/admin/products")
    revalidatePath("/employee/products")
    return { success: true, message: "Product deleted." }
  } catch (err) {
    console.error("deleteProduct failed:", err)
    return fail("Something went wrong. Please try again.")
  }
}

export async function updateStockLevels(formData: FormData): Promise<ActionResult> {
  const actorId = await requireAdmin()
  if (!actorId) return fail("You do not have permission to do that.")

  try {
    const inventoryId = str(formData.get("inventoryId"))
    if (!inventoryId) return fail("Missing inventory row.")

    const minStock = Number(str(formData.get("minStock")))
    const maxStock = Number(str(formData.get("maxStock")))
    if (!Number.isInteger(minStock) || minStock < 0) return fail("Enter a whole number for min stock.")
    if (!Number.isInteger(maxStock) || maxStock < 0) return fail("Enter a whole number for max stock.")

    const row = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      include: {
        product: { select: { name: true } },
        shop: { select: { name: true } },
      },
    })
    if (!row) return fail("Inventory row not found.")

    await prisma.inventory.update({
      where: { id: inventoryId },
      data: { minStock, maxStock },
    })

    const meta = await getRequestMeta()
    await logAuditEvent("stock_levels_updated", {
      actorId,
      entityType: "Product",
      entityId: row.productId,
      detail: `${row.product.name} @ ${row.shop.name} (min: ${minStock}, max: ${maxStock})`,
      ip: meta.ip,
    })
    revalidatePath(`/admin/products/${row.productId}`)
    revalidatePath("/admin/inventory")
    revalidatePath("/employee/inventory")
    revalidatePath("/admin/products")
    return { success: true, message: "Stock levels updated." }
  } catch (err) {
    console.error("updateStockLevels failed:", err)
    return fail("Something went wrong. Please try again.")
  }
}

export async function deleteAllProducts(): Promise<ActionResult> {
  const actorId = await requireAdmin()
  if (!actorId) return fail("You do not have permission to do that.")

  try {
    const count = await prisma.product.count()
    if (count === 0) return fail("No products to delete.")

    await prisma.$transaction(async (tx) => {
      // Delete all product-related data
      const products = await tx.product.findMany({ select: { id: true } })
      const productIds = products.map((p) => p.id)

      await tx.saleItem.deleteMany({ where: { productId: { in: productIds } } })
      await tx.stockTransaction.deleteMany({ where: { productId: { in: productIds } } })
      await tx.inventory.deleteMany({ where: { productId: { in: productIds } } })
      await tx.product.deleteMany({})
    })

    const meta = await getRequestMeta()
    await logAuditEvent("products_deleted_all", {
      actorId,
      entityType: "Product",
      detail: `Deleted ${count} products`,
      ip: meta.ip,
    })
    revalidatePath("/admin/products")
    revalidatePath("/admin/inventory")
    revalidatePath("/admin/dashboard")
    return { success: true, message: `All ${count} products deleted.` }
  } catch (err) {
    console.error("deleteAllProducts failed:", err)
    return fail("Something went wrong. Please try again.")
  }
}
