"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getSignedInRole } from "@/lib/auth-utils"
import { getRequestMeta, type ActionResult } from "@/lib/actions"
import { logAuditEvent } from "@/lib/audit-log"

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

    const product = await prisma.product.update({
      where: { id },
      data: { name, sku, description, price, cost, categoryId, imageUrl },
    })

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
