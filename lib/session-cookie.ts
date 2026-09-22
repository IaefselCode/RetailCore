import { headers } from "next/headers"

/**
 * Derive the NextAuth session cookie name exactly the way @auth/core does,
 * so cookies set by our own server actions (loginAction, /api/auth/refresh)
 * stay compatible with auth()'s decoder in the middleware:
 *
 *   cookie name = (secure ? "__Secure-" : "") + "authjs.session-token"
 *   secure      = useSecureCookies ?? baseURL protocol === "https:"
 *   JWT salt    = cookie name (this is what auth() passes to jwt.decode)
 *
 * Getting any of these wrong means the middleware cannot see the session:
 * the user signs in successfully, then gets bounced straight back to
 * /login — which is exactly what happened in production before this
 * helper existed (loginAction hardcoded the dev cookie name).
 */
export async function sessionTokenCookie(): Promise<{ name: string; secure: boolean }> {
  const envUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL

  let secure: boolean
  if (envUrl) {
    try {
      secure = new URL(envUrl).protocol === "https:"
    } catch {
      secure = process.env.NODE_ENV === "production"
    }
  } else {
    // No explicit base URL: mirror @auth/core and infer from the request.
    const h = await headers()
    const proto = h.get("x-forwarded-proto")?.split(",")[0]?.trim()
    secure = proto ? proto === "https" : process.env.NODE_ENV === "production"
  }

  return {
    name: `${secure ? "__Secure-" : ""}authjs.session-token`,
    secure,
  }
}
