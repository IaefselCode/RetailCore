import Link from "next/link"
import { ResetPasswordForm } from "@/app/(auth)/reset-password/reset-password-form"

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token) {
    return (
      <div className="space-y-4 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          This reset link is invalid or expired.
        </p>
        <Link
          href="/forgot-password"
          className="text-xs text-primary underline-offset-4 hover:underline"
        >
          Request a new link
        </Link>
      </div>
    )
  }

  return <ResetPasswordForm token={token} />
}
