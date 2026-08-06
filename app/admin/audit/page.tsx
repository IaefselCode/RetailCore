import { Suspense } from "react"
import { requireRole } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "next-intl/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ServerTable, createServerColumnHelper } from "@/components/shared/server-table"
import { Skeleton } from "@/components/ui/skeleton"

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

const auditHelper = createServerColumnHelper<AuditRow>()

export default async function AdminAuditPage() {
  await requireRole("ADMIN")
  const t = await getTranslations("audit")

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <AuditTableSection />
    </div>
  )
}

async function AuditTableSection() {
  const t = await getTranslations("audit")
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("authEvents")}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Suspense
          fallback={
            <div className="flex h-40 items-center justify-center">
              <Skeleton className="h-24 w-full max-w-md" />
            </div>
          }
        >
          <AuditTableBody />
        </Suspense>
      </CardContent>
    </Card>
  )
}

async function AuditTableBody() {
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
  ])

  return (
    <ServerTable
      data={logs}
      columns={columns}
      getRowId={(row) => row.id}
      empty={t("empty")}
    />
  )
}
