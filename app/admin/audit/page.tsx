import { Suspense } from "react"
import { requireRole } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
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

const EVENT_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  login_success: { label: "Login", variant: "default" },
  login_failure: { label: "Failed login", variant: "destructive" },
  password_reset_request: { label: "Reset requested", variant: "secondary" },
  password_reset_complete: { label: "Password changed", variant: "secondary" },
  admin_password_reset: { label: "Admin reset", variant: "secondary" },
}

export default async function AdminAuditPage() {
  await requireRole("ADMIN")

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Audit Log</h1>
        <p className="text-sm text-muted-foreground">
          Sign-in and password-reset activity (last 200 events).
        </p>
      </div>

      <AuditTableSection />
    </div>
  )
}

function AuditTableSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Authentication Events</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>User Agent</TableHead>
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
      </CardContent>
    </Card>
  )
}

async function AuditBodyRows() {
  const logs = await prisma.authLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  })

  return (
    <>
      {logs.length === 0 && (
        <TableRow>
          <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
            No authentication events recorded yet.
          </TableCell>
        </TableRow>
      )}
      {logs.map((log) => {
        const meta = EVENT_LABELS[log.event] ?? {
          label: log.event,
          variant: "secondary" as const,
        }
        return (
          <TableRow key={log.id}>
            <TableCell className="whitespace-nowrap text-xs">
              {log.createdAt.toLocaleString()}
            </TableCell>
            <TableCell>
              <Badge variant={meta.variant}>{meta.label}</Badge>
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
