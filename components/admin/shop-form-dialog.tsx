"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import { createShop, updateShop } from "@/lib/organization-actions"

export interface ShopRow {
  id: string
  name: string
  address: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  phone: string | null
  isActive: boolean
  employeeCount: number
}

export function ShopFormDialog({
  shop,
  open,
  onOpenChange,
}: {
  shop?: ShopRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useTranslations("shops")
  const tc = useTranslations("common")
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [isActive, setIsActive] = useState(shop?.isActive ?? true)

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)

    startTransition(async () => {
      const result = shop
        ? await updateShop(fd)
        : await createShop(fd)
      if (result.success) {
        toast.success(result.message)
        router.refresh()
        onOpenChange(false)
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{shop ? t("editTitle") : t("createTitle")}</DialogTitle>
          <DialogDescription>
            {shop ? t("editSubtitle") : t("createSubtitle")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {shop && <input type="hidden" name="id" value={shop.id} />}
          <div className="space-y-2">
            <Label htmlFor="shop-name">{t("name")}</Label>
            <Input
              id="shop-name"
              name="name"
              defaultValue={shop?.name ?? ""}
              placeholder={t("namePlaceholder")}
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="shop-address">{t("address")}</Label>
              <Input id="shop-address" name="address" defaultValue={shop?.address ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shop-city">{t("city")}</Label>
              <Input id="shop-city" name="city" defaultValue={shop?.city ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shop-state">{t("state")}</Label>
              <Input id="shop-state" name="state" defaultValue={shop?.state ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shop-zip">{t("zipCode")}</Label>
              <Input id="shop-zip" name="zipCode" defaultValue={shop?.zipCode ?? ""} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="shop-phone">{t("phone")}</Label>
            <Input id="shop-phone" name="phone" defaultValue={shop?.phone ?? ""} />
          </div>
          {shop && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="shop-active">{t("activeLabel")}</Label>
              <Switch
                id="shop-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <input type="hidden" name="isActive" value={isActive ? "on" : "off"} />
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <AnimateButton type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {tc("cancel")}
            </AnimateButton>
            <AnimateButton type="submit" variant="accent" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {tc("save")}
            </AnimateButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
