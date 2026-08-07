"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { useSession } from "next-auth/react"
import {
  LayoutDashboard,
  Warehouse,
  Package,
  ShoppingCart,
  History,
  Bell,
  User,
  Settings,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

const navItems = [
  { labelKey: "dashboard", href: "/employee/dashboard", icon: LayoutDashboard },
  { labelKey: "inventory", href: "/employee/inventory", icon: Warehouse },
  { labelKey: "products", href: "/employee/products", icon: Package },
  { labelKey: "recordSale", href: "/employee/record-sale", icon: ShoppingCart },
  { labelKey: "salesHistory", href: "/employee/sales-history", icon: History },
]

const bottomItems = [
  { labelKey: "notifications", href: "/employee/notifications", icon: Bell },
  { labelKey: "profile", href: "/employee/profile", icon: User },
  { labelKey: "settings", href: "/employee/settings", icon: Settings },
]

export function EmployeeSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const user = session?.user ?? null
  const tn = useTranslations("nav")

  const initials = (() => {
    if (!user) return "EM"
    const parts = (user.name ?? "").split(" ").filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return (user.name?.[0] ?? user.email?.[0] ?? "E").toUpperCase()
  })()

  return (
    <aside className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
          RC
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold leading-tight">RetailCore</span>
          <span className="text-[11px] leading-tight text-sidebar-foreground/60">Staff Portal</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== "/employee/dashboard" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {tn(item.labelKey)}
            </Link>
          )
        })}
      </nav>

      <Separator className="mx-3 w-auto" />

      <div className="space-y-1 p-3">
        {bottomItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {tn(item.labelKey)}
            </Link>
          )
        })}
      </div>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <Avatar className="size-8">
            <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? "Employee"} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium leading-tight">{user?.name ?? "Employee"}</span>
            <span className="text-[11px] leading-tight text-sidebar-foreground/60">
              {user?.email ?? "Staff Portal"}
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}
