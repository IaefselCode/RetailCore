import Link from "next/link"
import { Bell } from "lucide-react"
import { Button as AnimateButton } from "@/components/ui/animate-button"

export function NotificationBell({
  count = 0,
  href,
  size = "icon-sm",
}: {
  count?: number
  href: string
  size?: "icon" | "icon-sm"
}) {
  return (
    <Link href={href}>
      <AnimateButton variant="ghost" size={size} className="relative" aria-label="Notifications">
        <span className="relative inline-flex">
          <Bell className="size-4" />
          {count > 0 && (
            <span className="absolute -right-1 -top-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive px-1 text-[9px] leading-none font-semibold text-white">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </span>
      </AnimateButton>
    </Link>
  )
}
