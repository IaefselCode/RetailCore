import { requireRole } from "@/lib/auth-utils"
import { AdminShell } from "@/components/shared/admin-shell"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("ADMIN")
  return <AdminShell>{children}</AdminShell>
}
