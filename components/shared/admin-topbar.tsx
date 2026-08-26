"use client"

import { Menu, User, LogOut, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import { motion } from "motion/react"

import { Button as AnimateButton } from "@/components/ui/animate-button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { LanguageSwitcher } from "@/components/shared/language-switcher"
import { GlobalSearch } from "@/components/shared/global-search"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { NotificationBell } from "@/components/shared/notification-bell"

interface AdminTopbarProps {
  onMenuClick?: () => void
  notificationSlot?: React.ReactNode
}

export function AdminTopbar({ onMenuClick, notificationSlot }: AdminTopbarProps) {
  const router = useRouter()
  const t = useTranslations("topbar")
  const { data: session } = useSession()
  const user = session?.user ?? null

  const initials = (() => {
    if (!user) return "AU"
    const parts = (user.name ?? "").split(" ").filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return (user.name?.[0] ?? user.email?.[0] ?? "A").toUpperCase()
  })()

  return (
    <header className="flex h-14 items-center gap-2 border-b bg-background px-3 sm:px-6">
      <AnimateButton variant="ghost" size="icon" className="lg:hidden shrink-0" onClick={onMenuClick}>
        <Menu className="size-5" />
      </AnimateButton>
      <div className="flex-1 min-w-0" />
      <motion.div
        className="hidden sm:block w-full max-w-xs"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <GlobalSearch placeholder={t("searchPlaceholder")} />
      </motion.div>
      <div className="flex items-center gap-1 shrink-0">
        <LanguageSwitcher />
        <ThemeToggle />
        {notificationSlot ?? <NotificationBell href="/admin/notifications" />}
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full">
            <Avatar className="size-8">
              <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? "Admin"} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <div className="truncate">{user?.name ?? "Admin User"}</div>
              <div className="text-xs font-normal text-muted-foreground truncate">
                {user?.email ?? ""}
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
            <DropdownMenuItem className="text-destructive" onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
