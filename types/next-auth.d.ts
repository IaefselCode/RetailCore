import type { DefaultSession } from "next-auth"

type Role = "ADMIN" | "EMPLOYEE"

declare module "@auth/core/types" {
  interface User {
    role: Role
  }

  interface Session {
    user: {
      id: string
      role: Role
    } & DefaultSession["user"]
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    uid?: string
    role?: Role
  }
}
