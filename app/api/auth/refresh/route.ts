import { NextResponse } from "next/server"
import { auth, createRefreshToken } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sessionTokenCookie } from "@/lib/session-cookie"

const ACCESS_TOKEN_MAX_AGE = 15 * 60            // 15 minutes
const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60 // 30 days

export async function POST() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const userId = session.user.id

    // Find the user's most recent valid refresh token
    const existingToken = await prisma.refreshToken.findFirst({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    })

    if (!existingToken) {
      return NextResponse.json({ error: "No valid refresh token" }, { status: 401 })
    }

    // Rotate: revoke old, create new
    await prisma.refreshToken.delete({ where: { id: existingToken.id } })
    const newRefreshToken = await createRefreshToken(userId)

    // Build a new JWT using NextAuth's encode. The salt MUST be the
    // session cookie name (with its production __Secure- prefix) — that's
    // exactly what auth() uses to decode. An empty salt produced a token
    // the middleware could never decrypt, kicking users out after a
    // refresh. The cookie name must match too, or the browser ends up
    // with two cookies and the session silently disappears.
    const { name: cookieName, secure } = await sessionTokenCookie()
    const { encode } = await import("next-auth/jwt")
    const now = Math.floor(Date.now() / 1000)

    const newJwt = await encode({
      secret: process.env.AUTH_SECRET!,
      salt: cookieName,
      token: {
        uid: userId,
        role: session.user.role,
        locale: (session as unknown as Record<string, unknown>).locale ?? "en",
        image: session.user.image ?? null,
        refreshToken: newRefreshToken,
        refreshExpiresAt: Date.now() + REFRESH_TOKEN_MAX_AGE * 1000,
        iat: now,
        exp: now + ACCESS_TOKEN_MAX_AGE,
      },
    })

    const response = NextResponse.json({ success: true })
    response.cookies.set(cookieName, newJwt, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: ACCESS_TOKEN_MAX_AGE,
    })

    return response
  } catch (err) {
    console.error("Refresh token error:", err)
    return NextResponse.json({ error: "Refresh failed" }, { status: 500 })
  }
}
