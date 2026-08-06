import { Suspense } from "react"
import { requireRole } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "next-intl/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { TableRowsSkeleton } from "@/components/shared/skeleton-primitives"

const EVENT_KEYS: Record<string, string> = {
  login_success: "login",
  login_failure: "failedLogin",
  password_reset_request: "resetRequested",
  password_reset_complete: "passwordChanged",
  admin_password_reset: "adminReset",
}

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
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("colWhen")}</TableHead>
                <TableHead>{t("colEvent")}</TableHead>
                <TableHead>{t("colEmail")}</TableHead>
                <TableHead>{t("colIp")}</TableHead>
                <TableHead>{t("colUserAgent")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <Suspense
                fallback={
                  <TableRowsSkeleton
                    rows={10}
                    columns={["w-36", "w-20", "w-32", "w-24", "w-48"]}
                  />
                }
              >
                <AuditBodyRows />
              </Suspense>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

async function AuditBodyRows() {
  const t = await getTranslations("audit")
  const logs = await prisma.authLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  })

  return (
    <>
      {logs.length === 0 && (
        <TableRow>
          <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
            {t("empty")}
          </TableCell>
        </TableRow>
      )}
      {logs.map((log) => {
        const key = EVENT_KEYS[log.event]
        const variant: "default" | "secondary" | "destructive" = key
          ? key === "failedLogin"
            ? "destructive"
            : key === "login"
            ? "default"
            : "secondary"
          : "secondary"
        return (
          <TableRow key={log.id}>
            <TableCell className="whitespace-nowrap text-xs">
              {log.createdAt.toLocaleString()}
            </TableCell>
            <TableCell>
              <Badge variant={variant}>{key ? t(key) : log.event}</Badge>
            </TableCell>
            <TableCell>{log.email}</TableCell>
            <TableCell className="text-xs">{log.ip ?? "—"}</TableCell>
            <TableCell className="max-w-[240px] truncate text-xs text-muted-foreground">
              {log.userAgent ?? "—"}
            </TableCell>
          </TableRow>
        )
      })}
    </>
  )
}
