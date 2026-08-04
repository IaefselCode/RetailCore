import { redirect } from "next/navigation"

export default function GeneralInfoRedirect() {
  redirect("/admin/shops/create")
}
