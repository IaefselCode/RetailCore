"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { ChevronRight, Trash2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import Link from "next/link"
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
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DataTable,
  createAppColumnHelper,
} from "@/components/shared/data-table"
import { setEmployeeActive, deleteEmployee } from "@/lib/organization-actions"
import { EmployeeFormDialog, type EmployeeRow, type ShopOption } from "@/components/admin/employee-form-dialog"

const helper = createAppColumnHelper<EmployeeRow>()

export function EmployeesTable({
  employees,
  shops,
}: {
  employees: EmployeeRow[]
  shops: ShopOption[]
}) {
  const router = useRouter()
  const t = useTranslations("employees")
  const tc = useTranslations("common")
  const [editing, setEditing] = useState<EmployeeRow | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<EmployeeRow | null>(null)
  const [pending, startTransition] = useTransition()

  function toggle(emp: EmployeeRow) {
    const fd = new FormData()
    fd.append("id", emp.id)
    fd.append("active", String(!emp.isActive))
    startTransition(async () => {
      const result = await setEmployeeActive(fd)
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  const columns = helper.columns([
    helper.accessor("firstName", {
      id: "name",
      header: t("colName"),
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.firstName} {row.original.lastName}</p>
          <p className="text-xs text-muted-foreground">{row.original.email}</p>
        </div>
      ),
    }),
    helper.accessor("position", {
      header: t("colPosition"),
      cell: ({ getValue }) => (getValue() as string | null) ?? "—",
    }),
    helper.accessor("shopId", {
      id: "shop",
      header: t("colShop"),
      filterFn: "equalsString",
      cell: ({ row }) => row.original.shopName,
    }),
    helper.accessor("isActive", {
      id: "status",
      header: t("colStatus"),
      filterFn: "equals",
      cell: ({ getValue }) => (
        <Badge variant={getValue() ? "default" : "secondary"}>
          {getValue() ? tc("active") : tc("inactive")}
        </Badge>
      ),
    }),
    helper.accessor("hireDate", {
      header: t("colHireDate"),
      cell: ({ getValue }) => {
        const d = getValue() as string | null
        return <span className="text-muted-foreground">{d ? new Date(d).toLocaleDateString() : "—"}</span>
      },
    }),
    helper.display({
      id: "actions",
      header: t("colActions"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <AnimateButton size="sm" variant="outline" onClick={() => setEditing(row.original)} disabled={pending}>
            {tc("edit")}
          </AnimateButton>
          <AnimateButton size="sm" variant="ghost" asChild>
            <Link href={`/admin/employees/${row.original.id}`}>
              {tc("view")} <ChevronRight className="size-3" />
            </Link>
          </AnimateButton>
          <AnimateButton
            size="icon-sm"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setDeleting(row.original)}
            disabled={pending}
            aria-label={t("deleteConfirmTitle")}
          >
            <Trash2 className="size-4" />
          </AnimateButton>
          <Switch
            checked={row.original.isActive}
            onCheckedChange={() => toggle(row.original)}
            disabled={pending}
            aria-label={row.original.isActive ? tc("inactive") : tc("active")}
          />
        </div>
      ),
    }),
  ])

  return (
    <>
      <DataTable
        data={employees}
        columns={columns}
        getRowId={(row) => row.id}
        searchable
        searchPlaceholder={t("searchPlaceholder")}
        numbered
        pagination
        toolbar={(table) => (
          <Select
            value={String((table.getColumn("shop")?.getFilterValue() as string) ?? "all")}
            onValueChange={(v) => {
              if (!v) return
              table.getColumn("shop")?.setFilterValue(v === "all" ? undefined : v)
            }}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder={t("allShops")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allShops")}</SelectItem>
              {shops.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        empty={t("noResults")}
      />

      <EmployeeFormDialog
        employee={editing === undefined ? undefined : editing ?? null}
        shops={shops}
        open={editing !== undefined}
        onOpenChange={(open) => {
          if (!open) setEditing(undefined)
        }}
      />

      <AlertDialog open={deleting !== null} onOpenChange={(open) => { if (!open) setDeleting(null) }}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteConfirmDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={() => {
                if (!deleting) return
                const fd = new FormData()
                fd.append("id", deleting.id)
                startTransition(async () => {
                  const result = await deleteEmployee(fd)
                  setDeleting(null)
                  if (result.success) {
                    toast.success(result.message)
                    router.refresh()
                  } else {
                    toast.error(result.message)
                  }
                })
              }}
            >
              {t("deleteConfirmButton")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
