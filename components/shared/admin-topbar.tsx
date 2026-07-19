"use client"

import { Search, Bell, Menu, User, LogOut, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import { useUser, useClerk } from "@clerk/nextjs"
import { motion } from "motion/react"

import { Button as AnimateButton } from "@/components/ui/animate-button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface AdminTopbarProps {
  onMenuClick?: () => void
}

export function AdminTopbar({ onMenuClick }: AdminTopbarProps) {
  const router = useRouter()
  const { user } = useUser()
  const { signOut } = useClerk()

  const initials = (() => {
    if (!user) return "AU"
    const a = user.firstName?.charAt(0) ?? ""
    const b = user.lastName?.charAt(0) ?? ""
    if (a || b) return (a + b).toUpperCase()
    return user.emailAddresses?.[0]?.emailAddress?.charAt(0)?.toUpperCase() ?? "A"
  })()

  return (
    <header className="flex h-14 items-center gap-2 border-b bg-background px-3 sm:px-6">
      <AnimateButton variant="ghost" size="icon" className="lg:hidden shrink-0" onClick={onMenuClick}>
        <Menu className="size-5" />
      </AnimateButton>
      <div className="flex-1 min-w-0" />
      <motion.div
        className="relative hidden sm:block max-w-xs"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search..." className="pl-8" />
      </motion.div>
      <div className="flex items-center gap-1 shrink-0">
        <ThemeToggle />
        <motion.div
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          whileHover={{ scale: 1.15 }}
        >
          <AnimateButton
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => router.push("/admin/notifications")}
          >
            <Bell className="size-5" />
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive" />
          </AnimateButton>
        </motion.div>
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full">
            <Avatar className="size-8">
              <AvatarImage src={user?.imageUrl} alt={user?.fullName ?? "Admin"} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <div className="truncate">{user?.fullName ?? "Admin User"}</div>
              <div className="text-xs font-normal text-muted-foreground truncate">
                {user?.emailAddresses?.[0]?.emailAddress ?? ""}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/admin/profile")}>
              <User className="size-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/admin/settings")}>
              <Settings className="size-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ redirectUrl: "/login" })}>
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
