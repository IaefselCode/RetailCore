import { auth } from "@/lib/auth"
import { requireRole } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { isStrongPassword } from "@/lib/password-policy"
import { logAuthEvent } from "@/lib/auth-log"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"

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

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">User Accounts</h1>
        <p className="text-sm text-muted-foreground">
          Manage sign-in accounts and reset passwords.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Accounts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[260px]">Reset Password</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {[user.firstName, user.lastName].filter(Boolean).join(" ") || "—"}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? "default" : "secondary"}>
                      {user.isActive ? "Active" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <form action={resetPassword} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={user.id} />
                      <Input
                        name="password"
                        type="password"
                        placeholder="New password"
                        className="h-8"
                        required
                        minLength={8}
                        pattern={PASSWORD_PATTERN}
                        title="8+ chars with uppercase, lowercase, a number and a symbol"
                      />
                      <AnimateButton type="submit" variant="outline" size="sm" className="h-8 shrink-0">
                        Reset
                      </AnimateButton>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No user accounts yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
