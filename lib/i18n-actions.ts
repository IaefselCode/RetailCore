"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isLocale, type Locale } from "@/lib/i18n"

export async function updateLocale(locale: string): Promise<{ success: boolean }> {
  if (!isLocale(locale)) return { success: false }

  const session = await auth()
  if (session?.user?.id) {
    try {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { locale: locale as Locale },
      })
    } catch {
      // non-fatal: cookie still applies for this browser
    }
  }

  ;(await cookies()).set("locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  })

  revalidatePath("/", "layout")
  return { success: true }
}
