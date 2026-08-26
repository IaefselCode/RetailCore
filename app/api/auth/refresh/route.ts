import { NextResponse } from "next/server"
import { auth, createRefreshToken } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

    // Build a new JWT using NextAuth's encode
    const { encode } = await import("next-auth/jwt")
    const now = Math.floor(Date.now() / 1000)

    const newJwt = await encode({
      secret: process.env.AUTH_SECRET!,
      salt: "",
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
    response.cookies.set("authjs.session-token", newJwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
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
