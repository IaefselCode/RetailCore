import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { randomBytes, createHash } from "crypto"
import { prisma } from "@/lib/prisma"
import { getClientIp, rateLimit } from "@/lib/rate-limit"
import { logAuthEvent } from "@/lib/auth-log"
import { DEFAULT_LOCALE, normalizeLocale } from "@/lib/i18n"

const LOGIN_MAX_ATTEMPTS = 10
const LOGIN_WINDOW_MS = 15 * 60 * 1000
const IP_MAX_ATTEMPTS = 20
const IP_WINDOW_MS = 60 * 1000

const DUMMY_HASH = "$2b$12$N0aKAcfB8j9KhRug9..IXe39b/lwZfq4Lr2UQwP5vvpx5aLlU2K.6"

// Token lifetimes
export const ACCESS_TOKEN_MAX_AGE = 15 * 60            // 15 minutes
export const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60 // 30 days
const REFRESH_THRESHOLD_MS = 10 * 60 * 1000             // Refresh when <10 minutes left

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

export async function createRefreshToken(userId: string): Promise<string> {
  const raw = randomBytes(32).toString("base64url")
  const tokenHash = hashToken(raw)

  await prisma.refreshToken.create({
    data: {
      tokenHash,
      userId,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE * 1000),
    },
  })

  return raw
}

export async function revokeAllUserRefreshTokens(userId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { userId } })
}

export async function validateRefreshToken(token: string): Promise<string | null> {
  const tokenHash = hashToken(token)
  const record = await prisma.refreshToken.findUnique({ where: { tokenHash } })

  if (!record) return null
  if (record.expiresAt.getTime() < Date.now()) {
    await prisma.refreshToken.delete({ where: { id: record.id } })
    return null
  }

  return record.userId
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: ACCESS_TOKEN_MAX_AGE,
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
  events: {
    async signOut(msg) {
      // Revoke all refresh tokens for this user on logout
      const userId = (msg && "token" in msg && msg.token && (msg.token as Record<string, unknown>)?.uid) as string | null
      if (userId) {
        await revokeAllUserRefreshTokens(userId)
      }
    },
  },
  callbacks: {
    async jwt({ token, user, trigger, session: updateSession }) {
      // On initial sign-in: populate token + create refresh token
      if (user) {
        token.uid = user.id
        token.role = user.role
        token.locale = user.locale ?? DEFAULT_LOCALE
        token.image = user.image ?? null

        // Create a refresh token and store its hash in the JWT
        const refreshToken = await createRefreshToken(user.id!)
        token.refreshToken = refreshToken
        token.refreshExpiresAt = Date.now() + REFRESH_TOKEN_MAX_AGE * 1000
        token.iat = Math.floor(Date.now() / 1000)
      }

      // When the client calls update() on the session, pick up fresh values
      if (trigger === "update" && updateSession?.user?.image !== undefined) {
        token.image = updateSession.user.image
      }

      // Check if access token needs refresh (within threshold of expiry)
      const tokenExp = ((token.iat as number) || 0) + ACCESS_TOKEN_MAX_AGE
      const now = Math.floor(Date.now() / 1000)
      token.needsRefresh = tokenExp - now < REFRESH_THRESHOLD_MS / 1000

      return token
    },
    session({ session, token }) {
      if (session.user && token.uid) {
        session.user.id = token.uid
        session.user.role = token.role ?? "EMPLOYEE"
        session.user.locale = token.locale ?? DEFAULT_LOCALE
        session.user.image =
          (token.image as string) ?? session.user.image ?? null
      }
      // Expose token expiry and refresh flag to client
      const sess = session as unknown as Record<string, unknown>
      sess.expires =
        new Date(((token.iat as number) || 0) * 1000 + ACCESS_TOKEN_MAX_AGE * 1000).toISOString()
      sess.needsRefresh = token.needsRefresh ?? false
      return session
    },
  },
})
