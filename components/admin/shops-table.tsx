"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { MapPin, Plus, Trash2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button as AnimateButton } from "@/components/ui/animate-button"
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
import {
  DataTable,
  createAppColumnHelper,
} from "@/components/shared/data-table"
import { setShopActive, deleteShop } from "@/lib/organization-actions"
import { ShopFormDialog, type ShopRow } from "@/components/admin/shop-form-dialog"

const helper = createAppColumnHelper<ShopRow>()

export function ShopsTable({ shops }: { shops: ShopRow[] }) {
  const t = useTranslations("shops")
  const tc = useTranslations("common")
  const router = useRouter()
  const [editing, setEditing] = useState<ShopRow | null | undefined>(undefined)
  const [deleteTarget, setDeleteTarget] = useState<ShopRow | null>(null)
  const [pending, startTransition] = useTransition()

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

  const columns = helper.columns([
    helper.accessor("name", { header: t("colName"), cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span> }),
    helper.accessor("city", {
      id: "location",
      header: t("colLocation"),
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="size-3 shrink-0" />
          {[row.original.city, row.original.address].filter(Boolean).join(", ") || "—"}
        </div>
      ),
    }),
    helper.accessor("phone", {
      header: t("colPhone"),
      cell: ({ getValue }) => (getValue() as string | null) ?? "—",
    }),
    helper.accessor("isActive", {
      id: "status",
      header: t("colStatus"),
      filterFn: "equals",
      cell: ({ getValue }) => (
        <Badge variant={getValue() ? "default" : "secondary"}>
          {getValue() ? t("active") : t("inactive")}
        </Badge>
      ),
    }),
    helper.accessor("employeeCount", { header: t("colEmployees"), cell: ({ getValue }) => getValue() as number }),
    helper.display({
      id: "actions",
      header: t("colActions"),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <AnimateButton size="sm" variant="outline" onClick={() => setEditing(row.original)} disabled={pending}>
            {tc("edit")}
          </AnimateButton>
          <AnimateButton
            size="icon-sm"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setDeleteTarget(row.original)}
            disabled={pending}
            aria-label={t("deleteConfirmTitle")}
          >
            <Trash2 className="size-4" />
          </AnimateButton>
          <Switch
            checked={row.original.isActive}
            onCheckedChange={() => toggle(row.original)}
            disabled={pending}
            aria-label={row.original.isActive ? t("deactivated") : t("activated")}
          />
        </div>
      ),
    }),
  ])

  return (
    <>
      <DataTable
        data={shops}
        columns={columns}
        getRowId={(row) => row.id}
        searchable
        searchPlaceholder={t("searchPlaceholder")}
        empty={t("noResults")}
      />

      <div className="flex justify-end">
        <AnimateButton variant="accent" onClick={() => setEditing(null)}>
          <Plus />
          {t("addShop")}
        </AnimateButton>
      </div>

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
            <AlertDialogAction variant="destructive" disabled={pending} onClick={confirmDelete}>
              {t("deleteConfirmButton")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
