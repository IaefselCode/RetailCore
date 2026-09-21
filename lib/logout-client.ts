"use client"

import { signOut } from "next-auth/react"
import { logoutAndRevoke } from "@/lib/logout-actions"

export async function handleLogout() {
  // 1. Revoke refresh tokens on the server (best-effort)
  try {
    await logoutAndRevoke()
  } catch {
    // Continue to signOut even if revoke fails
  }

  // 2. Clear session cookie + redirect via the CLIENT.
  //    This is critical: server-side signOut inside a server action
  //    cannot send Set-Cookie headers to the browser.
  await signOut({ callbackUrl: "/login" })
}
