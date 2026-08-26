"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getRequestMeta, type ActionResult } from "@/lib/actions"
import { logAuditEvent } from "@/lib/audit-log"
import { deleteImage } from "@/lib/images-server"
import { notifyAdmins } from "@/lib/notification-actions"

function fail(message: string): ActionResult {
  return { success: false, message }
}

function str(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim()
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[+]?[\d\s()-]{7,20}$/

export type AdminProfileData = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  imageUrl: string | null
  role: string
  createdAt: string
  lastLogin: string | null
  lastPasswordChange: string | null
}

export async function getAdminProfile(): Promise<AdminProfileData | null> {
  const session = await auth()
  if (!session?.user?.id) return null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      imageUrl: true,
      role: true,
      createdAt: true,
    },
  })
  if (!user) return null

  const [lastLogin, lastPasswordChange] = await Promise.all([
    prisma.authLog.findFirst({
      where: { userId: user.id, event: "login_success" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    prisma.authLog.findFirst({
      where: { userId: user.id, event: "password_changed" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ])

  return {
    id: user.id,
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    email: user.email,
    phone: user.phone,
    imageUrl: user.imageUrl,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    lastLogin: lastLogin?.createdAt.toISOString() ?? null,
    lastPasswordChange: lastPasswordChange?.createdAt.toISOString() ?? null,
  }
}

export async function updateAdminProfile(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) return fail("You must be signed in.")

  const userId = session.user.id
  try {
    const firstName = str(formData.get("firstName"))
    const lastName = str(formData.get("lastName"))
    const email = str(formData.get("email")).toLowerCase()
    const phone = str(formData.get("phone"))
    const imageUrl = str(formData.get("imageUrl"))

    if (firstName.length < 1) return fail("First name is required.")
    if (lastName.length < 1) return fail("Last name is required.")
    if (!EMAIL_RE.test(email)) return fail("Enter a valid email address.")
    if (phone && !PHONE_RE.test(phone)) return fail("Enter a valid phone number.")

    // Email must stay unique across users
    const clash = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })
    if (clash && clash.id !== userId) {
      return fail("That email is already in use by another account.")
    }

    const old = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true, lastName: true, email: true, phone: true, imageUrl: true,
      },
    })
    if (!old) return fail("Account not found.")

    await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        email,
        phone: phone || null,
        imageUrl: imageUrl || null,
      },
    })

    // Remove the replaced profile picture from storage
    if (
      old.imageUrl &&
      old.imageUrl !== imageUrl &&
      old.imageUrl.startsWith("/uploads/profiles/")
    ) {
      await deleteImage(old.imageUrl)
    }

    const meta = await getRequestMeta()
    await logAuditEvent("profile_updated", {
      actorId: userId,
      entityType: "User",
      entityId: userId,
      detail: email,
      ip: meta.ip,
    })

    return { success: true, message: "Profile updated successfully." }
  } catch (err) {
    console.error("updateAdminProfile failed:", err)
    return fail("Something went wrong. Please try again.")
  }
}

export async function updateProfilePhoto(
  imageUrl: string | null
): Promise<{ success: boolean; imageUrl: string | null }> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, imageUrl: null }

  const userId = session.user.id
  try {
    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { imageUrl: true },
    })
    if (!current) return { success: false, imageUrl: null }

    await prisma.user.update({
      where: { id: userId },
      data: { imageUrl: imageUrl || null },
    })

    // Remove the old photo from storage if it was a local upload
    if (
      current.imageUrl &&
      current.imageUrl !== imageUrl &&
      current.imageUrl.startsWith("/uploads/profiles/")
    ) {
      await deleteImage(current.imageUrl)
    }

    // Notify admins about the photo change
    const employee = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    })
    const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : "An employee"
    const action = imageUrl ? "updated their profile photo" : "removed their profile photo"
    await notifyAdmins({
      title: "Profile Photo Updated",
      message: `${employeeName} ${action}.`,
      type: "info",
    })

    return { success: true, imageUrl: imageUrl || null }
  } catch (err) {
    console.error("updateProfilePhoto failed:", err)
    return { success: false, imageUrl: null }
  }
}

export async function updateEmployeeProfile(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) return fail("You must be signed in.")

  const userId = session.user.id
  try {
    const firstName = str(formData.get("firstName"))
    const lastName = str(formData.get("lastName"))
    const email = str(formData.get("email")).toLowerCase()
    const phone = str(formData.get("phone"))
    const imageUrl = str(formData.get("imageUrl"))

    if (firstName.length < 1) return fail("First name is required.")
    if (lastName.length < 1) return fail("Last name is required.")
    if (!EMAIL_RE.test(email)) return fail("Enter a valid email address.")
    if (phone && !PHONE_RE.test(phone)) return fail("Enter a valid phone number.")

    // Email must stay unique across users.
    const clash = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })
    if (clash && clash.id !== userId) {
      return fail("That email is already in use by another account.")
    }

    // Fetch old values to detect what changed and compare later
    const old = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true, lastName: true, email: true, phone: true, imageUrl: true,
      },
    })
    if (!old) return fail("Account not found.")

    await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        email,
        phone: phone || null,
        imageUrl: imageUrl || null,
      },
    })

    // Remove the replaced profile picture from storage.
    if (
      old.imageUrl &&
      old.imageUrl !== imageUrl &&
      old.imageUrl.startsWith("/uploads/profiles/")
    ) {
      await deleteImage(old.imageUrl)
    }

    const meta = await getRequestMeta()
    await logAuditEvent("profile_updated", {
      actorId: userId,
      entityType: "User",
      entityId: userId,
      detail: email,
      ip: meta.ip,
    })

    // Build a list of changed fields for the admin notification
    const changedFields: string[] = []
    if (old.firstName !== firstName) changedFields.push("first name")
    if (old.lastName !== lastName) changedFields.push("last name")
    if (old.email !== email) changedFields.push("email")
    if ((old.phone ?? "") !== (phone || "")) changedFields.push("phone")
    if ((old.imageUrl ?? "") !== (imageUrl || "")) changedFields.push("profile photo")

    const employeeName = `${old.firstName} ${old.lastName}`
    const fieldList = changedFields.length > 0 ? changedFields.join(", ") : "profile"
    await notifyAdmins({
      title: "Employee Profile Updated",
      message: `${employeeName} updated their ${fieldList}.`,
      type: "info",
    })

    return { success: true, message: "Profile updated." }
  } catch (err) {
    console.error("updateEmployeeProfile failed:", err)
    return fail("Something went wrong. Please try again.")
  }
}
