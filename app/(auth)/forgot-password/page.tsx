"use client"

import { useActionState } from "react"
import { motion } from "motion/react"
import { Loader2, Mail } from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import { requestPasswordReset } from "@/lib/reset-actions"

const initialState = { success: false, message: "" }

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    initialState
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-xl">Forgot password?</CardTitle>
          <CardDescription>
            Enter your account email and we&apos;ll send you a reset link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                className="pl-8"
                required
              />
            </div>
          </div>

          {state.message && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-xs ${state.success ? "text-emerald-600" : "text-destructive"}`}
            >
              {state.message}
            </motion.p>
          )}

          <AnimateButton
            type="submit"
            className="w-full"
            disabled={pending}
          >
            {pending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Sending...
              </span>
            ) : (
              "Send reset link"
            )}
          </AnimateButton>
        </form>

          <Link
            href="/login"
            className="block text-center text-xs text-primary underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  )
}
