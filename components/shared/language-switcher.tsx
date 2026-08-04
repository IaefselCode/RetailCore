"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, Globe, Loader2 } from "lucide-react"
import { useLocale } from "next-intl"
import { LOCALES, LOCALE_LABELS, normalizeLocale } from "@/lib/i18n"
import { updateLocale } from "@/lib/i18n-actions"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export function LanguageSwitcher({
  compact = false,
  className,
}: {
  compact?: boolean
  className?: string
}) {
  const locale = useLocale()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function change(next: string) {
    if (next === locale) return
    setOpen(false)
    startTransition(async () => {
      await updateLocale(next)
      router.refresh()
    })
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            className
          )}
          aria-label="Language"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Globe className="size-4" />
          )}
          {!compact && LOCALE_LABELS[normalizeLocale(locale)]}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {LOCALES.map((l) => (
          <DropdownMenuItem key={l} onClick={() => change(l)}>
            <span className="flex-1">{LOCALE_LABELS[l]}</span>
            {l === locale && <Check className="size-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
