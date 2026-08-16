"use client"

import { useTransition } from "react"
import { useTranslations } from "next-intl"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ShopOption {
  id: string
  name: string
}

export function InventoryFilters({
  shops,
  initial,
}: {
  shops: ShopOption[]
  initial: { q: string; shopId: string; status: string }
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const t = useTranslations("inventory")
  const [isPending, startTransition] = useTransition()

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value && value !== "all") params.set(key, value)
      else params.delete(key)
    }
    // Mark the navigation as a transition so the search field can show a
    // pending spinner while the server re-filters the (possibly large) table.
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <Card>
      <CardContent className="flex flex-wrap gap-3 pt-6">
        <div className="relative w-full sm:w-64">
          <Input
            defaultValue={initial.q}
            placeholder={t("filterSearch")}
            className="pr-8"
            onChange={(e) => updateParams({ q: e.target.value })}
            aria-busy={isPending}
          />
          {isPending && (
            <Loader2 className="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
        <Select
          defaultValue={initial.shopId}
          onValueChange={(v) => v && updateParams({ shopId: v })}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder={t("filterShop")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allShops")}</SelectItem>
            {shops.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          defaultValue={initial.status}
          onValueChange={(v) => v && updateParams({ status: v })}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder={t("filterStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allStatus")}</SelectItem>
            <SelectItem value="in">{t("statusIn")}</SelectItem>
            <SelectItem value="low">{t("statusLow")}</SelectItem>
            <SelectItem value="out">{t("statusOut")}</SelectItem>
            <SelectItem value="over">{t("statusOver")}</SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  )
}
