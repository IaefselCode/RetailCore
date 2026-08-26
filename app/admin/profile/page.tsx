import { redirect } from "next/navigation"
import { getAdminProfile } from "@/lib/profile-actions"
import { AdminProfileForm } from "@/components/admin/admin-profile-form"

export default async function ProfilePage() {
  const profile = await getAdminProfile()
  if (!profile) redirect("/login")

  return <AdminProfileForm profile={profile} />
}
