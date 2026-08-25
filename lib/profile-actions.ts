"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getRequestMeta, type ActionResult } from "@/lib/actions"
import { logAuditEvent } from "@/lib/audit-log"
import { deleteImage } from "@/lib/images-server"

function fail(message: string): ActionResult {
  return { success: false, message }
}

function str(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim()
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[+]?[\d\s()-]{7,20}$/

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

    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { imageUrl: true },
    })
    if (!current) return fail("Account not found.")

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
      current.imageUrl &&
      current.imageUrl !== imageUrl &&
      current.imageUrl.startsWith("/uploads/profiles/")
    ) {
      await deleteImage(current.imageUrl)
    }

    const meta = await getRequestMeta()
    await logAuditEvent("profile_updated", {
      actorId: userId,
      entityType: "User",
      entityId: userId,
      detail: email,
      ip: meta.ip,
    })

    return { success: true, message: "Profile updated." }
  } catch (err) {
    console.error("updateEmployeeProfile failed:", err)
    return fail("Something went wrong. Please try again.")
  }
}
