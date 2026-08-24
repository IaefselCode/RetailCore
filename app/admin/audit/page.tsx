import { Suspense } from "react"
import { requireRole } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "next-intl/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ServerTable, createServerColumnHelper } from "@/components/shared/server-table"
import { AuditToolbar, DeleteLogButton } from "@/components/admin/audit-actions"
import { SkeletonTable } from "@/components/shared/skeleton-primitives"

const EVENT_KEYS: Record<string, string> = {
  login_success: "login",
  login_failure: "failedLogin",
  password_reset_request: "resetRequested",
  password_reset_complete: "passwordChanged",
  admin_password_reset: "adminReset",
}

interface AuditRow {
  id: string
  createdAt: Date
  event: string
  email: string
  ip: string | null
  userAgent: string | null
}

interface AuditLogData {
  id: string
  createdAt: Date
  event: string
  email: string
  ip: string | null
  userAgent: string | null
}

const auditHelper = createServerColumnHelper<AuditRow>()

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>
}) {
  await requireRole("ADMIN")
  const t = await getTranslations("audit")
  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? 1))

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <AuditTableSection page={page} />
    </div>
  )
}

async function AuditTableSection({ page }: { page: number }) {
  const t = await getTranslations("audit")
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="text-base">{t("authEvents")}</CardTitle>
        <AuditToolbar />
      </CardHeader>
      <CardContent className="p-0">
        <Suspense
          fallback={
            <SkeletonTable
              rows={8}
              columns={["w-32", "w-20", "w-40", "w-16", "w-60", "w-8"]}
              headers={["#", t("colWhen"), t("colEvent"), t("colEmail"), t("colIp"), t("colUserAgent"), t("colActions")]}
            />
          }
        >
          <AuditTableBody page={page} />
        </Suspense>
      </CardContent>
    </Card>
  )
}

async function AuditTableBody({ page }: { page: number }) {
  const t = await getTranslations("audit")
  const logs = await prisma.authLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  })

  const columns = auditHelper.columns([
    auditHelper.accessor("createdAt", {
      header: t("colWhen"),
      cell: ({ getValue }) => (
        <span className="whitespace-nowrap text-xs">{(getValue() as Date).toLocaleString()}</span>
      ),
    }),
    auditHelper.accessor("event", {
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
    auditHelper.accessor("email", { header: t("colEmail"), cell: ({ getValue }) => getValue() as string }),
    auditHelper.accessor("ip", {
      header: t("colIp"),
      cell: ({ getValue }) => <span className="text-xs">{(getValue() as string | null) ?? "—"}</span>,
    }),
    auditHelper.accessor("userAgent", {
      header: t("colUserAgent"),
      cell: ({ getValue }) => (
        <span className="max-w-[240px] truncate text-xs text-muted-foreground">
          {(getValue() as string | null) ?? "—"}
        </span>
      ),
    }),
    auditHelper.display({
      id: "actions",
      header: t("colActions"),
      cell: ({ row }) => <DeleteLogButton id={(row.original as AuditLogData).id} />,
    }),
  ])

  return (
    <ServerTable
      data={logs}
      columns={columns}
      getRowId={(row) => row.id}
      numbered
      empty={t("empty")}
      pageSize={10}
      page={page}
      total={logs.length}
    />
  )
}
