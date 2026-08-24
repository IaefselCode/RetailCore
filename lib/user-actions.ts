"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { isStrongPassword } from "@/lib/password-policy"
import { logAuthEvent } from "@/lib/auth-log"

export async function resetPassword(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return

  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, role: true },
  })
  if (actor?.role !== "ADMIN") return

  const id = String(formData.get("id") ?? "")
  const password = String(formData.get("password") ?? "")
  if (!id || !isStrongPassword(password)) return

  const target = await prisma.user.findUnique({
    where: { id },
    select: { email: true },
  })
  if (!target) return

  const passwordHash = await bcrypt.hash(password, 12)
  await prisma.user.update({ where: { id }, data: { passwordHash } })

  const h = await headers()
  const xff = h.get("x-forwarded-for")
  void logAuthEvent("admin_password_reset", target.email, {
    userId: actor.id,
    ip: xff?.split(",")[0]?.trim(),
    userAgent: h.get("user-agent"),
  })

  revalidatePath("/admin/users")
}
