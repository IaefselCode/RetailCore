"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { AdminSidebar } from "@/components/shared/admin-sidebar"
import { AdminTopbar } from "@/components/shared/admin-topbar"
import { Loader2 } from "lucide-react"

export function AdminShell({
  children,
  unreadCount = 0,
}: {
  children: React.ReactNode
  unreadCount?: number
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { status } = useSession()
  const router = useRouter()

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="hidden w-64 shrink-0 border-r bg-sidebar lg:flex lg:flex-col">
        <AdminSidebar />
      </aside>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <AdminSidebar onNavClick={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminTopbar onMenuClick={() => setSidebarOpen(true)} unreadCount={unreadCount} />
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
