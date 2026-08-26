"use client"

import { signOut } from "next-auth/react"
import { logoutAndRevoke } from "@/lib/logout-actions"

export async function handleLogout() {
  try {
    await logoutAndRevoke()
  } catch {
    // Fallback: sign out even if revoke fails
    await signOut({ callbackUrl: "/login" })
  }
}
