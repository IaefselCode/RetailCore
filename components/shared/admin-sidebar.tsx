"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { signOut, useSession } from "next-auth/react"
import {
  LayoutDashboard,
  Store,
  Users,
  Package,
  Warehouse,
  CreditCard,
  BarChart3,
  Settings,
  User,
  LogOut,
  ScrollText,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const navItems = [
  { labelKey: "dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { labelKey: "shops", href: "/admin/shops", icon: Store },
  { labelKey: "employees", href: "/admin/employees", icon: Users },
  { labelKey: "products", href: "/admin/products", icon: Package },
  { labelKey: "inventory", href: "/admin/inventory", icon: Warehouse },
  { labelKey: "sales", href: "/admin/sales", icon: CreditCard },
  { labelKey: "analytics", href: "/admin/analytics", icon: BarChart3 },
  { labelKey: "auditLog", href: "/admin/audit", icon: ScrollText },
]

interface AdminSidebarProps {
  onNavClick?: () => void
}

export function AdminSidebar({ onNavClick }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const user = session?.user ?? null
  const tn = useTranslations("nav")
  const tc = useTranslations("common")

  const initials = (() => {
    if (!user) return "AU"
    const parts = (user.name ?? "").split(" ").filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return (user.name?.[0] ?? user.email?.[0] ?? "A").toUpperCase()
  })()

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2 px-6">
        <Store className="size-6" />
        <span className="font-heading text-lg font-semibold">RetailCore</span>
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavClick}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {tn(item.labelKey)}
            </Link>
          )
        })}
      </nav>
      <Separator />
      <div className="p-3">
        <Link
          href="/admin/settings"
          onClick={onNavClick}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname === "/admin/settings" || pathname.startsWith("/admin/settings/")
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <Settings className="size-4 shrink-0" />
          {tn("settings")}
        </Link>
      </div>
      <Separator />
      <div className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full cursor-default items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground">
            <Avatar className="size-8">
              <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? "Admin"} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start text-left">
              <span className="text-sm font-medium">{user?.name ?? "Admin User"}</span>
              <span className="text-xs text-muted-foreground">RMS Admin</span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="right" className="w-48">
            <DropdownMenuLabel>{tn("profile")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/admin/profile")}>
              <User className="size-4" />
              {tn("profile")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOut className="size-4" />
              {tc("signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
