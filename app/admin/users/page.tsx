import { requireRole } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "next-intl/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UsersTable } from "@/components/admin/users-table"

export const metadata = { title: "Users | RetailCore" }

export default async function AdminUsersPage() {
  await requireRole("ADMIN")
  const t = await getTranslations("users")

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("accounts")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <UsersTable
            rows={users.map((u) => ({
              id: u.id,
              firstName: u.firstName,
              lastName: u.lastName,
              email: u.email,
              role: u.role,
              isActive: u.isActive,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  )
}