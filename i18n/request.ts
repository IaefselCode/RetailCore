import { getRequestConfig } from "next-intl/server"
import { cookies } from "next/headers"
import { normalizeLocale } from "@/lib/i18n"

export default getRequestConfig(async () => {
  const cookieLocale = (await cookies()).get("locale")?.value
  const locale = normalizeLocale(cookieLocale)

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
