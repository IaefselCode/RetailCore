import { Suspense } from "react"
import { requireRole } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "next-intl/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AuditToolbar } from "@/components/admin/audit-actions"
import { SkeletonTable } from "@/components/shared/skeleton-primitives"
import { AuditTable } from "@/components/admin/audit-table"

export const metadata = { title: "Audit | RetailCore" }

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
  const logs = await prisma.authLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  })

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
              headers={[]}
            />
          }
        >
          <AuditTable rows={logs} />
        </Suspense>
      </CardContent>
    </Card>
  )
}