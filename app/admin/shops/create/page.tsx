import { Suspense } from "react"
import { requireRole } from "@/lib/auth-utils"
import { CreateShopWizard } from "@/components/admin/create-shop-wizard"
import { SkeletonWizard } from "@/components/shared/skeletons"

export const metadata = { title: "Create Shop | RetailCore" }

export default async function CreateShopPage() {
  await requireRole("ADMIN")

  return (
    <Suspense fallback={<SkeletonWizard steps={2} />}>
      <CreateShopWizard />
    </Suspense>
  )
}

