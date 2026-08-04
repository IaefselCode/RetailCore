import { redirect } from "next/navigation"

export default function ManagerAssignmentRedirect() {
  redirect("/admin/shops/create")
}
