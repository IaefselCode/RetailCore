"use server"

import { auth, revokeAllUserRefreshTokens } from "@/lib/auth"

/**
 * Server-side: revoke all refresh tokens for the current user.
 * Does NOT call signOut — cookie clearing is handled client-side
 * by the calling code to ensure Set-Cookie headers reach the browser.
 */
export async function logoutAndRevoke() {
  const session = await auth()
  if (session?.user?.id) {
    await revokeAllUserRefreshTokens(session.user.id)
  }
}
