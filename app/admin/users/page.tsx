import { auth } from "@/lib/auth"
import { requireRole } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "next-intl/server"
import bcrypt from "bcryptjs"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { isStrongPassword } from "@/lib/password-policy"
import { logAuthEvent } from "@/lib/auth-log"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import { ServerTable, createServerColumnHelper } from "@/components/shared/server-table"

interface UserRow {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  role: string
  isActive: boolean
}

const userHelper = createServerColumnHelper<UserRow>()

const PASSWORD_PATTERN = "(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}"

async function resetPassword(formData: FormData) {
  "use server"

  const session = await auth()
  if (!session?.user?.id) return

  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, role: true },
  })
  if (actor?.role !== "ADMIN") return

  const id = String(formData.get("id") ?? "")
  const password = String(formData.get("password") ?? "")
  if (!id || !isStrongPassword(password)) return

  const target = await prisma.user.findUnique({
    where: { id },
    select: { email: true },
  })
  if (!target) return

  const passwordHash = await bcrypt.hash(password, 12)
  await prisma.user.update({ where: { id }, data: { passwordHash } })

  const h = await headers()
  const xff = h.get("x-forwarded-for")
  void logAuthEvent("admin_password_reset", target.email, {
    userId: actor.id,
    ip: xff?.split(",")[0]?.trim(),
    userAgent: h.get("user-agent"),
  })

  revalidatePath("/admin/users")
}

export default async function AdminUsersPage() {
  await requireRole("ADMIN")
  const t = await getTranslations("users")

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  })

  const columns = userHelper.columns([
    userHelper.accessor("firstName", {
      header: t("colName"),
      cell: ({ row }) => (
        <span className="font-medium">
          {[row.original.firstName, row.original.lastName].filter(Boolean).join(" ") || "—"}
        </span>
      ),
    }),
    userHelper.accessor("email", {
      header: t("colEmail"),
      cell: ({ getValue }) => getValue() as string,
    }),
    userHelper.accessor("role", {
      header: t("colRole"),
      cell: ({ getValue }) => {
        const role = getValue() as string
        return (
          <Badge variant={role === "ADMIN" ? "default" : "secondary"}>{role}</Badge>
        )
      },
    }),
    userHelper.accessor("isActive", {
      header: t("colStatus"),
      cell: ({ getValue }) => (
        <Badge variant={getValue() ? "default" : "secondary"}>
          {getValue() ? t("active") : t("disabled")}
        </Badge>
      ),
    }),
    userHelper.display({
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
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("accounts")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ServerTable
            data={users}
            columns={columns}
            getRowId={(row) => row.id}
            empty={t("empty")}
          />
        </CardContent>
      </Card>
    </div>
  )
}
