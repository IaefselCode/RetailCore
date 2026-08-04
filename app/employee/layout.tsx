import { requireRole } from "@/lib/auth-utils"
import { EmployeeShell } from "@/components/shared/employee-shell"

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  await requireRole("EMPLOYEE")
  return <EmployeeShell>{children}</EmployeeShell>
}
