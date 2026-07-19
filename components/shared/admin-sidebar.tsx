"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Store,
  Users,
  Package,
  Warehouse,
  CreditCard,
  BarChart3,
  FileText,
  Settings,
  User,
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
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Shops", href: "/admin/shops", icon: Store },
  { label: "Employees", href: "/admin/employees", icon: Users },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Inventory", href: "/admin/inventory", icon: Warehouse },
  { label: "Sales", href: "/admin/sales", icon: CreditCard },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Reports", href: "/admin/reports", icon: FileText },
]

interface AdminSidebarProps {
  onNavClick?: () => void
}

export function AdminSidebar({ onNavClick }: AdminSidebarProps) {
  const pathname = usePathname()

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
              {item.label}
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
          Settings
        </Link>
      </div>
      <Separator />
      <div className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full cursor-default items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground">
            <Avatar className="size-8">
              <AvatarImage src="/avatars/admin.png" alt="Admin" />
              <AvatarFallback>AU</AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start text-left">
              <span className="text-sm font-medium">Admin User</span>
              <span className="text-xs text-muted-foreground">RMS Admin</span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="right" className="w-48">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="size-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
