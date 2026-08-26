"use server"

import { sanitize } from "@/lib/sanitize"
import { revalidatePath } from "next/cache"
import { randomBytes } from "crypto"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { getSignedInRole } from "@/lib/auth-utils"
import { getRequestMeta, type ActionResult } from "@/lib/actions"
import { logAuditEvent } from "@/lib/audit-log"
import { notifyAdmins } from "@/lib/notification-actions"

export type EmployeeActionResult = ActionResult & { temporaryPassword?: string }

function fail(message: string): ActionResult {
  return { success: false, message }
}

function str(value: FormDataEntryValue | null): string {
  return sanitize(value)
}

function bool(value: FormDataEntryValue | null): boolean {
  return value === "on" || value === "true" || value === "1"
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function generateTemporaryPassword(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz"
  const digits = "23456789"
  const bytes = randomBytes(11)
  let body = ""
  for (let i = 0; i < 10; i++) body += letters[bytes[i] % letters.length]
  body += digits[bytes[10] % digits.length]
  return `Rc!${body}`
}

async function requireAdmin() {
  const { userId, role } = await getSignedInRole()
  if (!userId || role !== "ADMIN") return null
  return userId
}

export async function createShop(formData: FormData): Promise<ActionResult> {
  const actorId = await requireAdmin()
  if (!actorId) return fail("You do not have permission to do that.")

  try {
    const name = str(formData.get("name"))
    if (name.length < 2) return fail("Shop name is required.")

    const shop = await prisma.shop.create({
      data: {
        name,
        address: str(formData.get("address")) || null,
        city: str(formData.get("city")) || null,
        state: str(formData.get("state")) || null,
        zipCode: str(formData.get("zipCode")) || null,
        phone: str(formData.get("phone")) || null,
      },
    })

    const meta = await getRequestMeta()
    await logAuditEvent("shop_created", {
      actorId,
      entityType: "Shop",
      entityId: shop.id,
      detail: name,
      ip: meta.ip,
    })
    revalidatePath("/admin/shops")
    await notifyAdmins({ title: "New shop created", message: name + " has been added as a new location", type: "system" })
    return { success: true, message: "Shop created." }
  } catch (err) {
    console.error("createShop failed:", err)
    return fail("Something went wrong. Please try again.")
  }
}

export async function updateShop(formData: FormData): Promise<ActionResult> {
  const actorId = await requireAdmin()
  if (!actorId) return fail("You do not have permission to do that.")

  try {
    const id = str(formData.get("id"))
    const name = str(formData.get("name"))
    if (!id || name.length < 2) return fail("Shop name is required.")

    const shop = await prisma.shop.update({
      where: { id },
      data: {
        name,
        address: str(formData.get("address")) || null,
        city: str(formData.get("city")) || null,
        state: str(formData.get("state")) || null,
        zipCode: str(formData.get("zipCode")) || null,
        phone: str(formData.get("phone")) || null,
        isActive: bool(formData.get("isActive")),
      },
    })

    const meta = await getRequestMeta()
    await logAuditEvent(shop.isActive ? "shop_updated" : "shop_deactivated", {
      actorId,
      entityType: "Shop",
      entityId: shop.id,
      detail: name,
      ip: meta.ip,
    })
    revalidatePath("/admin/shops")
    return { success: true, message: shop.isActive ? "Shop updated." : "Shop deactivated." }
  } catch (err) {
    console.error("updateShop failed:", err)
    return fail("Something went wrong. Please try again.")
  }
}

export async function setShopActive(formData: FormData): Promise<ActionResult> {
  const actorId = await requireAdmin()
  if (!actorId) return fail("You do not have permission to do that.")

  try {
    const id = str(formData.get("id"))
    const active = bool(formData.get("active"))
    if (!id) return fail("Missing shop id.")

    const shop = await prisma.shop.update({ where: { id }, data: { isActive: active } })
    const meta = await getRequestMeta()
    await logAuditEvent(active ? "shop_activated" : "shop_deactivated", {
      actorId,
      entityType: "Shop",
      entityId: shop.id,
      detail: shop.name,
      ip: meta.ip,
    })
    revalidatePath("/admin/shops")
    return { success: true, message: active ? "Shop activated." : "Shop deactivated." }
  } catch (err) {
    console.error("setShopActive failed:", err)
    return fail("Something went wrong. Please try again.")
  }
}

export async function deleteShop(formData: FormData): Promise<ActionResult> {
  const actorId = await requireAdmin()
  if (!actorId) return fail("You do not have permission to do that.")

  try {
    const id = str(formData.get("id"))
    if (!id) return fail("Missing shop id.")

    const shop = await prisma.shop.findUnique({
      where: { id },
      select: { id: true, name: true },
    })
    if (!shop) return fail("Shop not found.")

    await prisma.$transaction(async (tx) => {
      const employees = await tx.employee.findMany({
        where: { shopId: id },
        select: { userId: true },
      })
      await tx.sale.deleteMany({ where: { shopId: id } })
      await tx.employee.deleteMany({ where: { shopId: id } })
      if (employees.length > 0) {
        await tx.user.deleteMany({
          where: { id: { in: employees.map((e) => e.userId) } },
        })
      }
      await tx.shop.delete({ where: { id } })
    })

    const meta = await getRequestMeta()
    await logAuditEvent("shop_deleted", {
      actorId,
      entityType: "Shop",
      entityId: shop.id,
      detail: shop.name,
      ip: meta.ip,
    })
    revalidatePath("/admin/shops")
    return { success: true, message: "Shop deleted." }
  } catch (err) {
    console.error("deleteShop failed:", err)
    return fail("Something went wrong. Please try again.")
  }
}

export async function createEmployee(formData: FormData): Promise<EmployeeActionResult> {
  const actorId = await requireAdmin()
  if (!actorId) return fail("You do not have permission to do that.")

  try {
    const firstName = str(formData.get("firstName"))
    const lastName = str(formData.get("lastName"))
    const email = str(formData.get("email")).toLowerCase()
    const position = str(formData.get("position"))
    const shopId = str(formData.get("shopId"))

    if (!firstName || !lastName) return fail("First and last name are required.")
    if (!EMAIL_RE.test(email)) return fail("Enter a valid email address.")
    if (!shopId) return fail("Select a shop.")

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return fail("An account with that email already exists.")

    const shop = await prisma.shop.findUnique({ where: { id: shopId } })
    if (!shop) return fail("Select a valid shop.")

    const salaryRaw = str(formData.get("salary"))
    const salary = salaryRaw ? Number(salaryRaw) : 0
    if (Number.isNaN(salary) || salary < 0) return fail("Enter a valid salary.")

    const hireDateRaw = str(formData.get("hireDate"))
    const hireDate = hireDateRaw ? new Date(hireDateRaw) : null
    if (hireDate && Number.isNaN(hireDate.getTime())) return fail("Enter a valid hire date.")

    const temporaryPassword = generateTemporaryPassword()
    const passwordHash = await bcrypt.hash(temporaryPassword, 12)

    const employee = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          role: "EMPLOYEE",
          locale: "en",
          isActive: true,
        },
      })
      return tx.employee.create({
        data: {
          userId: user.id,
          shopId,
          position: position || null,
          hireDate,
          salary,
          isActive: true,
        },
      })
    })

    const meta = await getRequestMeta()
    await logAuditEvent("employee_created", {
      actorId,
      entityType: "Employee",
      entityId: employee.id,
      detail: `${firstName} ${lastName} <${email}>`,
      ip: meta.ip,
    })
    revalidatePath("/admin/employees")
    await notifyAdmins({ title: "New employee onboarded", message: firstName + " " + lastName + " has been added to the team", type: "operational" })
    return {
      success: true,
      message: "Employee created.",
      temporaryPassword,
    }
  } catch (err) {
    console.error("createEmployee failed:", err)
    return fail(
      err instanceof Error && err.message.includes("unique")
        ? "An account with that email already exists."
        : "Something went wrong. Please try again."
    )
  }
}

export async function updateEmployee(formData: FormData): Promise<ActionResult> {
  const actorId = await requireAdmin()
  if (!actorId) return fail("You do not have permission to do that.")

  try {
    const id = str(formData.get("id"))
    const firstName = str(formData.get("firstName"))
    const lastName = str(formData.get("lastName"))
    const email = str(formData.get("email")).toLowerCase()
    const position = str(formData.get("position"))
    const shopId = str(formData.get("shopId"))
    const isActive = bool(formData.get("isActive"))

    if (!id || !firstName || !lastName) return fail("First and last name are required.")
    if (!EMAIL_RE.test(email)) return fail("Enter a valid email address.")
    if (!shopId) return fail("Select a shop.")

    const employee = await prisma.employee.findUnique({ where: { id } })
    if (!employee) return fail("Employee not found.")

    const emailTaken = await prisma.user.findFirst({
      where: { email, NOT: { id: employee.userId } },
    })
    if (emailTaken) return fail("An account with that email already exists.")

    const salaryRaw = str(formData.get("salary"))
    const salary = salaryRaw ? Number(salaryRaw) : 0
    if (Number.isNaN(salary) || salary < 0) return fail("Enter a valid salary.")

    const hireDateRaw = str(formData.get("hireDate"))
    const hireDate = hireDateRaw ? new Date(hireDateRaw) : null
    if (hireDate && Number.isNaN(hireDate.getTime())) return fail("Enter a valid hire date.")

    const updated = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: employee.userId },
        data: { firstName, lastName, email, isActive },
      })
      return tx.employee.update({
        where: { id },
        data: { shopId, position: position || null, hireDate, salary, isActive },
      })
    })

    const meta = await getRequestMeta()
    await logAuditEvent(isActive ? "employee_updated" : "employee_deactivated", {
      actorId,
      entityType: "Employee",
      entityId: updated.id,
      detail: `${firstName} ${lastName} <${email}>`,
      ip: meta.ip,
    })
    revalidatePath("/admin/employees")
    return { success: true, message: isActive ? "Employee updated." : "Employee deactivated." }
  } catch (err) {
    console.error("updateEmployee failed:", err)
    return fail("Something went wrong. Please try again.")
  }
}

export async function setEmployeeActive(formData: FormData): Promise<ActionResult> {
  const actorId = await requireAdmin()
  if (!actorId) return fail("You do not have permission to do that.")

  try {
    const id = str(formData.get("id"))
    const active = bool(formData.get("active"))
    if (!id) return fail("Missing employee id.")

    const employee = await prisma.employee.findUnique({ where: { id } })
    if (!employee) return fail("Employee not found.")

    await prisma.$transaction([
      prisma.user.update({ where: { id: employee.userId }, data: { isActive: active } }),
      prisma.employee.update({ where: { id }, data: { isActive: active } }),
    ])

    const meta = await getRequestMeta()
    await logAuditEvent(active ? "employee_activated" : "employee_deactivated", {
      actorId,
      entityType: "Employee",
      entityId: employee.id,
      ip: meta.ip,
    })
    revalidatePath("/admin/employees")
    return { success: true, message: active ? "Employee activated." : "Employee deactivated." }
  } catch (err) {
    console.error("setEmployeeActive failed:", err)
    return fail("Something went wrong. Please try again.")
  }
}

export async function deleteEmployee(formData: FormData): Promise<ActionResult> {
  const actorId = await requireAdmin()
  if (!actorId) return fail("You do not have permission to do that.")

  try {
    const id = str(formData.get("id"))
    if (!id) return fail("Missing employee id.")

    const employee = await prisma.employee.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    })
    if (!employee) return fail("Employee not found.")

    await prisma.$transaction(async (tx) => {
      // 1. Delete SaleItems for sales made by this employee
      const sales = await tx.sale.findMany({
        where: { employeeId: id },
        select: { id: true },
      })
      const saleIds = sales.map((s) => s.id)
      if (saleIds.length > 0) {
        await tx.saleItem.deleteMany({ where: { saleId: { in: saleIds } } })
      }

      // 2. Delete Sales made by this employee
      await tx.sale.deleteMany({ where: { employeeId: id } })

      // 3. Delete Notifications
      await tx.notification.deleteMany({ where: { userId: employee.userId } })

      // 4. Delete AuthLogs
      await tx.authLog.deleteMany({ where: { userId: employee.userId } })

      // 5. Delete RefreshTokens
      await tx.refreshToken.deleteMany({ where: { userId: employee.userId } })

      // 6. Delete NotificationPreference
      await tx.notificationPreference.deleteMany({ where: { userId: employee.userId } })

      // 7. Delete AuditLogs referencing this employee
      await tx.auditLog.deleteMany({
        where: {
          OR: [
            { actorId: employee.userId },
            { entityType: "Employee", entityId: id },
          ],
        },
      })

      // 8. Delete the User (cascades to Employee via onDelete: Cascade)
      await tx.user.delete({ where: { id: employee.userId } })
    })

    const meta = await getRequestMeta()
    await logAuditEvent("employee_deleted", {
      actorId,
      entityType: "Employee",
      entityId: employee.id,
      detail: `${employee.user.firstName} ${employee.user.lastName} <${employee.user.email}>`,
      ip: meta.ip,
    })
    revalidatePath("/admin/employees")
    return { success: true, message: "Employee deleted." }
  } catch (err) {
    console.error("deleteEmployee failed:", err)
    return fail("Something went wrong. Please try again.")
  }
}

export async function deleteAllShops(): Promise<ActionResult> {
  const actorId = await requireAdmin()
  if (!actorId) return fail("You do not have permission to do that.")

  try {
    const count = await prisma.shop.count()
    if (count === 0) return fail("No shops to delete.")

    await prisma.$transaction(async (tx) => {
      // Delete all shop-related data
      const employees = await tx.employee.findMany({ select: { userId: true } })
      const sales = await tx.sale.findMany({ select: { id: true } })
      const saleIds = sales.map((s) => s.id)

      if (saleIds.length > 0) {
        await tx.saleItem.deleteMany({ where: { saleId: { in: saleIds } } })
      }
      await tx.sale.deleteMany({})
      await tx.stockTransaction.deleteMany({})
      await tx.inventory.deleteMany({})
      await tx.employee.deleteMany({})
      if (employees.length > 0) {
        await tx.user.deleteMany({ where: { id: { in: employees.map((e) => e.userId) } } })
      }
      await tx.shop.deleteMany({})
    })

    const meta = await getRequestMeta()
    await logAuditEvent("shops_deleted_all", {
      actorId,
      entityType: "Shop",
      detail: `Deleted ${count} shops`,
      ip: meta.ip,
    })
    revalidatePath("/admin/shops")
    revalidatePath("/admin/employees")
    revalidatePath("/admin/dashboard")
    return { success: true, message: `All ${count} shops deleted.` }
  } catch (err) {
    console.error("deleteAllShops failed:", err)
    return fail("Something went wrong. Please try again.")
  }
}

export async function deleteAllEmployees(): Promise<ActionResult> {
  const actorId = await requireAdmin()
  if (!actorId) return fail("You do not have permission to do that.")

  try {
    const count = await prisma.employee.count()
    if (count === 0) return fail("No employees to delete.")

    await prisma.$transaction(async (tx) => {
      const employees = await tx.employee.findMany({ select: { userId: true, id: true } })
      const empIds = employees.map((e) => e.id)
      const userIds = employees.map((e) => e.userId)

      // Delete sales and sale items for these employees
      const sales = await tx.sale.findMany({ where: { employeeId: { in: empIds } }, select: { id: true } })
      const saleIds = sales.map((s) => s.id)
      if (saleIds.length > 0) {
        await tx.saleItem.deleteMany({ where: { saleId: { in: saleIds } } })
      }
      await tx.sale.deleteMany({ where: { employeeId: { in: empIds } } })

      // Delete user-related data
      await tx.notification.deleteMany({ where: { userId: { in: userIds } } })
      await tx.authLog.deleteMany({ where: { userId: { in: userIds } } })
      await tx.refreshToken.deleteMany({ where: { userId: { in: userIds } } })
      await tx.notificationPreference.deleteMany({ where: { userId: { in: userIds } } })
      await tx.auditLog.deleteMany({ where: { actorId: { in: userIds } } })

      await tx.employee.deleteMany({})
      await tx.user.deleteMany({ where: { id: { in: userIds } } })
    })

    const meta = await getRequestMeta()
    await logAuditEvent("employees_deleted_all", {
      actorId,
      entityType: "Employee",
      detail: `Deleted ${count} employees`,
      ip: meta.ip,
    })
    revalidatePath("/admin/employees")
    revalidatePath("/admin/dashboard")
    return { success: true, message: `All ${count} employees deleted.` }
  } catch (err) {
    console.error("deleteAllEmployees failed:", err)
    return fail("Something went wrong. Please try again.")
  }
}
