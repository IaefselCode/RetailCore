"use client"

import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import { DataTable, createAppColumnHelper } from "@/components/shared/data-table"
import { resetPassword } from "@/lib/user-actions"

interface UserRow {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  role: string
  isActive: boolean
}

const helper = createAppColumnHelper<UserRow>()

const PASSWORD_PATTERN = "(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}"

export function UsersTable({ rows }: { rows: UserRow[] }) {
  const t = useTranslations("users")

  const columns = helper.columns([
    helper.accessor("firstName", {
      header: t("colName"),
      cell: ({ row }) => (
        <span className="font-medium">
          {[row.original.firstName, row.original.lastName].filter(Boolean).join(" ") || "—"}
        </span>
      ),
    }),
    helper.accessor("email", {
      header: t("colEmail"),
      cell: ({ getValue }) => getValue() as string,
    }),
    helper.accessor("role", {
      header: t("colRole"),
      cell: ({ getValue }) => {
        const role = getValue() as string
        return <Badge variant={role === "ADMIN" ? "default" : "secondary"}>{role}</Badge>
      },
    }),
    helper.accessor("isActive", {
      header: t("colStatus"),
      cell: ({ getValue }) => (
        <Badge variant={getValue() ? "default" : "secondary"}>
          {getValue() ? t("active") : t("disabled")}
        </Badge>
      ),
    }),
    helper.display({
      id: "reset",
      header: t("colReset"),
      cell: ({ row }) => (
        <form action={resetPassword} className="flex items-center gap-2">
          <input type="hidden" name="id" value={row.original.id} />
          <Input
            name="password"
            type="password"
            placeholder={t("newPassword")}
            className="h-8"
            required
            minLength={8}
            pattern={PASSWORD_PATTERN}
            title={t("passwordTitle")}
          />
          <AnimateButton type="submit" variant="outline" size="sm" className="h-8 shrink-0">
            {t("reset")}
          </AnimateButton>
        </form>
      ),
    }),
  ])

  return (
    <DataTable
      data={rows}
      columns={columns}
      getRowId={(row) => row.id}
      numbered
      pagination
      empty={t("empty")}
    />
  )
}
