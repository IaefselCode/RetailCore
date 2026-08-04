"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, Search, Bell, User, Settings, LogOut } from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"

import { Button as AnimateButton } from "@/components/ui/animate-button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { LanguageSwitcher } from "@/components/shared/language-switcher"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { EmployeeSidebar } from "@/components/shared/employee-sidebar"

export function EmployeeTopbar() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const { data: session } = useSession()
  const user = session?.user ?? null

  const initials = (() => {
    if (!user) return "EM"
    const parts = (user.name ?? "").split(" ").filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return (user.name?.[0] ?? user.email?.[0] ?? "E").toUpperCase()
  })()

  return (
    <header className="flex h-14 items-center gap-2 border-b bg-background px-3 sm:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <AnimateButton variant="ghost" size="icon-sm" className="md:hidden shrink-0">
            <Menu className="size-5" />
          </AnimateButton>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <EmployeeSidebar />
        </SheetContent>
      </Sheet>

      <div className="flex-1 min-w-0" />

      <motion.div
        className="relative hidden sm:block max-w-xs"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search products, customers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
      </motion.div>

      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <LanguageSwitcher />
        <ThemeToggle />
        <motion.div
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Link href="/employee/notifications">
            <AnimateButton variant="ghost" size="icon-sm">
              <Bell className="size-5" />
            </AnimateButton>
          </Link>
        </motion.div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <AnimateButton variant="ghost" size="icon-sm" className="rounded-full">
              <Avatar className="size-7">
                <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </AnimateButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user?.name ?? "Employee"}</p>
              <p className="text-xs text-muted-foreground">{user?.email ?? ""}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/employee/profile")}>
              <User className="size-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/employee/settings")}>
              <Settings className="size-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOut className="size-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
