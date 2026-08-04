import type { DefaultSession } from "next-auth"
import type { Locale } from "@/lib/i18n"

type Role = "ADMIN" | "EMPLOYEE"

declare module "@auth/core/types" {
  interface User {
    role: Role
    locale?: Locale
  }

  interface Session {
    user: {
      id: string
      role: Role
      locale: Locale
    } & DefaultSession["user"]
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    uid?: string
    role?: Role
    locale?: Locale
  }
}
