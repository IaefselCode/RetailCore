import Link from "next/link"
import { Bell } from "lucide-react"
import { Button as AnimateButton } from "@/components/ui/animate-button"

export function NotificationBell({
  count = 0,
  href,
  size = "icon",
}: {
  count?: number
  href: string
  size?: "icon" | "icon-sm"
}) {
  return (
    <Link href={href}>
      <AnimateButton variant="ghost" size={size} className="relative" aria-label="Notifications">
        <Bell className="size-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-none font-semibold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </AnimateButton>
    </Link>
  )
}
