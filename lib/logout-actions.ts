"use server"

import { auth, revokeAllUserRefreshTokens } from "@/lib/auth"
import { signOut } from "@/lib/auth"

export async function logoutAndRevoke() {
  const session = await auth()
  if (session?.user?.id) {
    await revokeAllUserRefreshTokens(session.user.id)
  }
  await signOut({ redirect: true, redirectTo: "/login" })
}
