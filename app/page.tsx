import { redirect } from "next/navigation";
import { getRoleHomePath, getSignedInRole } from "@/lib/auth-utils";

export default async function Home() {
  const { userId, role } = await getSignedInRole();

  if (!userId) {
    redirect("/login");
  }

  redirect(getRoleHomePath(role));
}
