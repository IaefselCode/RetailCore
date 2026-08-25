import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { getClientIp, rateLimit } from "@/lib/rate-limit"
import { logAuthEvent } from "@/lib/auth-log"
import { DEFAULT_LOCALE, normalizeLocale } from "@/lib/i18n"

const LOGIN_MAX_ATTEMPTS = 10
const LOGIN_WINDOW_MS = 15 * 60 * 1000
const IP_MAX_ATTEMPTS = 20
const IP_WINDOW_MS = 60 * 1000

const DUMMY_HASH = "$2b$12$N0aKAcfB8j9KhRug9..IXe39b/lwZfq4Lr2UQwP5vvpx5aLlU2K.6"

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },
  trustHost: process.env.NODE_ENV === "development" || !!process.env.AUTH_URL,
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (credentials, request) => {
        const email = String(credentials?.email ?? "").trim().toLowerCase()
        const password = String(credentials?.password ?? "")
        const ip = getClientIp(request)

        if (!email || !password) return null
        if (!rateLimit(`email:${email}`, LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS)) return null
        if (!rateLimit(`ip:${ip}`, IP_MAX_ATTEMPTS, IP_WINDOW_MS)) return null

        const user = await prisma.user.findUnique({ where: { email } })

        let valid = false
        if (user && user.isActive && user.passwordHash) {
          valid = await bcrypt.compare(password, user.passwordHash)
        } else {
          await bcrypt.compare(password, DUMMY_HASH)
        }

        if (!user || !valid) {
          void logAuthEvent("login_failure", email, {
            ip,
            userAgent: request.headers.get("user-agent"),
          })
          return null
        }

        void logAuthEvent("login_success", email, {
          userId: user.id,
          ip,
          userAgent: request.headers.get("user-agent"),
        })

        return {
          id: user.id,
          email: user.email,
          name:
            [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
            undefined,
          image: user.imageUrl ?? undefined,
          role: user.role,
          locale: normalizeLocale(user.locale),
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user, trigger, session: updateSession }) {
      // On initial sign-in, populate from the authorize result
      if (user) {
        token.uid = user.id
        token.role = user.role
        token.locale = user.locale ?? DEFAULT_LOCALE
        token.image = user.image ?? null
      }
      // When the client calls update() on the session, pick up fresh values
      if (trigger === "update" && updateSession?.user?.image !== undefined) {
        token.image = updateSession.user.image
      }
      return token
    },
    session({ session, token }) {
      if (session.user && token.uid) {
        session.user.id = token.uid
        session.user.role = token.role ?? "EMPLOYEE"
        session.user.locale = token.locale ?? DEFAULT_LOCALE
        session.user.image = (token.image as string) ?? session.user.image ?? null
      }
      return session
    },
  },
})
