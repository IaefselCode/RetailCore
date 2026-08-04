import { cookies } from "next/headers"
import { auth } from "@/lib/auth"
import { DEFAULT_LOCALE, isLocale, normalizeLocale, type Locale } from "@/lib/i18n"

export async function getUserLocale(): Promise<Locale> {
  const cookieLocale = (await cookies()).get("locale")?.value
  if (isLocale(cookieLocale)) return cookieLocale

  const session = await auth()
  return normalizeLocale(session?.user?.locale ?? DEFAULT_LOCALE)
}
