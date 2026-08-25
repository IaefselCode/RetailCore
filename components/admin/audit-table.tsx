"use client"

import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { DataTable, createAppColumnHelper } from "@/components/shared/data-table"
import { DeleteLogButton } from "@/components/admin/audit-actions"

interface AuditRow {
  id: string
  createdAt: Date
  event: string
  email: string
  ip: string | null
  userAgent: string | null
}

const helper = createAppColumnHelper<AuditRow>()

const EVENT_KEYS: Record<string, string> = {
  login_success: "login",
  login_failure: "failedLogin",
  password_reset_request: "resetRequested",
  password_reset_complete: "passwordChanged",
  admin_password_reset: "adminReset",
}

export function AuditTable({ rows, cardless }: { rows: AuditRow[]; cardless?: boolean }) {
  const t = useTranslations("audit")

  const columns = helper.columns([
    helper.accessor("createdAt", {
      header: t("colWhen"),
      cell: ({ getValue }) => (
        <span className="whitespace-nowrap text-xs">{(getValue() as Date).toLocaleString()}</span>
      ),
    }),
    helper.accessor("event", {
      header: t("colEvent"),
      cell: ({ getValue }) => {
        const event = getValue() as string
        const key = EVENT_KEYS[event]
        const variant: "default" | "secondary" | "destructive" = key
          ? key === "failedLogin"
            ? "destructive"
            : key === "login"
              ? "default"
              : "secondary"
          : "secondary"
        return <Badge variant={variant}>{key ? t(key) : event}</Badge>
      },
    }),
    helper.accessor("email", {
      header: t("colEmail"),
      cell: ({ getValue }) => getValue() as string,
    }),
    helper.accessor("ip", {
      header: t("colIp"),
      cell: ({ getValue }) => (
        <span className="text-xs">{(getValue() as string | null) ?? "—"}</span>
      ),
    }),
    helper.accessor("userAgent", {
      header: t("colUserAgent"),
      cell: ({ getValue }) => (
        <span className="max-w-[240px] truncate text-xs text-muted-foreground">
          {(getValue() as string | null) ?? "—"}
        </span>
      ),
    }),
    helper.display({
      id: "actions",
      header: t("colActions"),
      cell: ({ row }) => <DeleteLogButton id={row.original.id} />,
    }),
  ])

  return (
    <DataTable
      data={rows}
      columns={columns}
      getRowId={(row) => row.id}
      numbered
      pagination
      cardless={cardless}
      empty={t("empty")}
    />
  )
}
