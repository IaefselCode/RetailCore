"use client"

import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { EmployeeSidebar } from "@/components/shared/employee-sidebar"
import { EmployeeTopbar } from "@/components/shared/employee-topbar"
import { Loader2 } from "lucide-react"

export function EmployeeShell({
  children,
  unreadCount = 0,
}: {
  children: React.ReactNode
  unreadCount?: number
}) {
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
      <aside className="hidden w-60 shrink-0 md:block">
        <EmployeeSidebar />
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <EmployeeTopbar unreadCount={unreadCount} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
