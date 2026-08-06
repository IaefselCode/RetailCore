"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Search, ChevronRight, Trash2 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
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
import { setEmployeeActive, deleteEmployee } from "@/lib/organization-actions"
import { EmployeeFormDialog, type EmployeeRow, type ShopOption } from "@/components/admin/employee-form-dialog"

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
  const [search, setSearch] = useState("")
  const [editing, setEditing] = useState<EmployeeRow | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<EmployeeRow | null>(null)
  const [pending, startTransition] = useTransition()

  const q = search.toLowerCase()
  const filtered = employees.filter(
    (e) =>
      `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
      (e.position ?? "").toLowerCase().includes(q) ||
      e.shopName.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q)
  )

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
                  <TableHead>{t("colPosition")}</TableHead>
                  <TableHead>{t("colShop")}</TableHead>
                  <TableHead>{t("colStatus")}</TableHead>
                  <TableHead>{t("colHireDate")}</TableHead>
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
                {filtered.map((emp) => (
                  <TableRow key={emp.id} className="transition-colors hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <p className="font-medium">{emp.firstName} {emp.lastName}</p>
                        <p className="text-xs text-muted-foreground">{emp.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{emp.position ?? "—"}</TableCell>
                    <TableCell>{emp.shopName}</TableCell>
                    <TableCell>
                      <Badge variant={emp.isActive ? "default" : "secondary"}>
                        {emp.isActive ? tc("active") : tc("inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {emp.hireDate ? new Date(emp.hireDate).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <AnimateButton
                          size="sm"
                          variant="outline"
                          onClick={() => setEditing(emp)}
                          disabled={pending}
                        >
                          {tc("edit")}
                        </AnimateButton>
                        <AnimateButton size="sm" variant="ghost" asChild>
                          <Link href={`/admin/employees/${emp.id}`}>
                            {tc("view")} <ChevronRight className="size-3" />
                          </Link>
                        </AnimateButton>
                        <AnimateButton
                          size="icon-sm"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setDeleting(emp)}
                          disabled={pending}
                          aria-label={t("deleteConfirmTitle")}
                        >
                          <Trash2 className="size-4" />
                        </AnimateButton>
                        <Switch
                          checked={emp.isActive}
                          onCheckedChange={() => toggle(emp)}
                          disabled={pending}
                          aria-label={emp.isActive ? tc("inactive") : tc("active")}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

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
    </div>
  )
}
