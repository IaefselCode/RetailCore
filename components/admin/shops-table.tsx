"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { MapPin, Plus, Search, Trash2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { setShopActive, deleteShop } from "@/lib/organization-actions"
import { ShopFormDialog, type ShopRow } from "@/components/admin/shop-form-dialog"

interface ShopsTableProps {
  shops: ShopRow[]
  bodyOnly?: boolean
}

export function ShopsTable({ shops, bodyOnly = false }: ShopsTableProps) {
  const t = useTranslations("shops")
  const tc = useTranslations("common")
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [editing, setEditing] = useState<ShopRow | null | undefined>(undefined)
  const [deleteTarget, setDeleteTarget] = useState<ShopRow | null>(null)
  const [pending, startTransition] = useTransition()

  const q = search.toLowerCase()
  const filtered = shops.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      (s.city ?? "").toLowerCase().includes(q) ||
      (s.address ?? "").toLowerCase().includes(q)
  )

  function toggle(shop: ShopRow) {
    const fd = new FormData()
    fd.append("id", shop.id)
    fd.append("active", String(!shop.isActive))
    startTransition(async () => {
      const result = await setShopActive(fd)
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  function confirmDelete() {
    if (!deleteTarget) return
    const fd = new FormData()
    fd.append("id", deleteTarget.id)
    startTransition(async () => {
      const result = await deleteShop(fd)
      if (result.success) {
        toast.success(result.message)
        setDeleteTarget(null)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  const rowMarkup = (shop: ShopRow) => (
    <TableRow key={shop.id} className="transition-colors hover:bg-muted/50">
      <TableCell className="font-medium">{shop.name}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="size-3 shrink-0" />
          {[shop.city, shop.address].filter(Boolean).join(", ") || "—"}
        </div>
      </TableCell>
      <TableCell>{shop.phone ?? "—"}</TableCell>
      <TableCell>
        <Badge variant={shop.isActive ? "default" : "secondary"}>
          {shop.isActive ? t("active") : t("inactive")}
        </Badge>
      </TableCell>
      <TableCell>{shop.employeeCount}</TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <AnimateButton
            size="sm"
            variant="outline"
            onClick={() => setEditing(shop)}
            disabled={pending}
          >
            {tc("edit")}
          </AnimateButton>
          <AnimateButton
            size="icon-sm"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setDeleteTarget(shop)}
            disabled={pending}
            aria-label={t("deleteConfirmTitle")}
          >
            <Trash2 className="size-4" />
          </AnimateButton>
          <Switch
            checked={shop.isActive}
            onCheckedChange={() => toggle(shop)}
            disabled={pending}
            aria-label={shop.isActive ? t("deactivated") : t("activated")}
          />
        </div>
      </TableCell>
    </TableRow>
  )

  const dialogs = (
    <>
      <ShopFormDialog
        shop={editing === undefined ? undefined : editing ?? null}
        open={editing !== undefined}
        onOpenChange={(open) => {
          if (!open) setEditing(undefined)
        }}
      />
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia>
              <AlertTriangle className="size-8 text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>{t("deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteConfirmDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>{tc("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={confirmDelete}
            >
              {t("deleteConfirmButton")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )

  if (bodyOnly) {
    // bodyOnly: render only the table rows (used by pages that manage their
    // own table chrome). Search filtering still applies client-side.
    return (
      <>
        {shops.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
              {t("noResults")}
            </TableCell>
          </TableRow>
        ) : (
          filtered.map(rowMarkup)
        )}
        {dialogs}
      </>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t("searchPlaceholder")}
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("colName")}</TableHead>
                  <TableHead>{t("colLocation")}</TableHead>
                  <TableHead>{t("colPhone")}</TableHead>
                  <TableHead>{t("colStatus")}</TableHead>
                  <TableHead>{t("colEmployees")}</TableHead>
                  <TableHead>{t("colActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                      {t("noResults")}
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map(rowMarkup)}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <AnimateButton variant="accent" onClick={() => setEditing(null)}>
          <Plus />
          {t("addShop")}
        </AnimateButton>
      </div>

      {dialogs}
    </div>
  )
}
