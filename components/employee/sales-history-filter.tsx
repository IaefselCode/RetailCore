"use client"

import { useRouter, usePathname } from "next/navigation"
import { Calendar } from "lucide-react"
import { Input } from "@/components/ui/input"

export function SalesHistoryFilter({ initialDate }: { initialDate: string }) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div className="relative w-full sm:max-w-sm">
      <Calendar className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="date"
        defaultValue={initialDate}
        className="pl-8"
        onChange={(e) => {
          const params = new URLSearchParams()
          if (e.target.value) params.set("date", e.target.value)
          router.push(`${pathname}?${params.toString()}`)
        }}
      />
    </div>
  )
}
