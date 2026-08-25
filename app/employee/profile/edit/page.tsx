import { requireEmployeeContext } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "next-intl/server"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProfileForm } from "@/components/employee/profile-form"

export const metadata = { title: "Edit Profile | RetailCore" }

export default async function EditProfilePage() {
  const ctx = await requireEmployeeContext()
  const t = await getTranslations("employeeProfile")

  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      imageUrl: true,
    },
  })

  if (!user) return null

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/employee/profile"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t("backToProfile")}
      </Link>

      <ProfileForm
        user={{
          firstName: user.firstName ?? "",
          lastName: user.lastName ?? "",
          email: user.email,
          phone: user.phone,
          imageUrl: user.imageUrl,
        }}
      />
    </div>
  )
}
