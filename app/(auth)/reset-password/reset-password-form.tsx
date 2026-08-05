"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import { resetPasswordFromForm } from "@/lib/reset-actions"

const initialState = { success: false, message: "" }

export function ResetPasswordForm({ token }: { token: string }) {
  const [showPassword, setShowPassword] = useState(false)
  const [state, formAction, pending] = useActionState(
    resetPasswordFromForm,
    initialState
  )

  if (state.success) {
    return (
      <Card className="shadow-none">
        <CardContent className="space-y-4">
          <p className="text-sm text-emerald-600">{state.message}</p>
          <Link
            href="/login"
            className="inline-block w-full text-center text-xs text-primary underline-offset-4 hover:underline"
          >
            Go to sign in
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-xl">Set a new password</CardTitle>
          <CardDescription>
            Choose a strong password for your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
        <form action={formAction} className="space-y-4" noValidate>
          <input type="hidden" name="token" value={token} />
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Uppercase, lowercase, a number and a symbol required.
            </p>
          </div>

          {state.message && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-destructive"
            >
              {state.message}
            </motion.p>
          )}

          <AnimateButton
            type="submit"
            className="w-full"
            variant="accent"
            disabled={pending}
          >
            {pending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Updating...
              </span>
            ) : (
              "Update password"
            )}
          </AnimateButton>
        </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
