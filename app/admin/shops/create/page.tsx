import { requireRole } from "@/lib/auth-utils"
import { CreateShopWizard } from "@/components/admin/create-shop-wizard"

export const metadata = { title: "Create Shop | RetailCore" }

export default async function CreateShopPage() {
  await requireRole("ADMIN")

  return <CreateShopWizard />
}
