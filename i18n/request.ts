import { getRequestConfig } from "next-intl/server"
import { getUserLocale } from "@/lib/i18n-server"

export default getRequestConfig(async () => {
  const locale = await getUserLocale()

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
