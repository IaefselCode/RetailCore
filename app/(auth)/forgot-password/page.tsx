"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "motion/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, ArrowLeft, CheckCircle2, Mail } from "lucide-react"
import { useSignIn } from "@clerk/nextjs/legacy"
import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

const forgotSchema = z.object({
  email: z.string().email("Enter a valid email address"),
})

type ForgotForm = z.infer<typeof forgotSchema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const { isLoaded, signIn } = useSignIn()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  })

  async function onSubmit(data: ForgotForm) {
    if (!isLoaded || !signIn) return

    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: data.email,
      })
      setSent(true)
      toast.success("Reset link sent to your email")
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to send reset link. Please try again."
      toast.error(message)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="size-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Check your email</CardTitle>
              <CardDescription>
                We&apos;ve sent a password reset link to your email. It may take a few
                minutes to arrive.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-3 text-center text-sm text-muted-foreground">
                <Mail className="mx-auto mb-1 size-4" />
                Didn&apos;t receive the email? Check your spam folder or try again.
              </div>
              <AnimateButton
                variant="outline"
                className="w-full"
                onClick={() => setSent(false)}
              >
                Send again
              </AnimateButton>
            </CardContent>
            <CardFooter className="justify-center">
              <Link
                href="/login"
                className="flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
              >
                <ArrowLeft className="size-3.5" />
                Back to Login
              </Link>
            </CardFooter>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <CardHeader>
              <CardTitle className="text-xl">Reset Password</CardTitle>
              <CardDescription>
                Enter your work email and we&apos;ll send you a reset link.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4"
                noValidate
              >
                <div className="space-y-2">
                  <Label htmlFor="email">Work Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    {...register("email")}
                    aria-invalid={!!errors.email}
                  />
                  {errors.email && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-destructive"
                    >
                      {errors.email.message}
                    </motion.p>
                  )}
                </div>
                <AnimateButton
                  type="submit"
                  className="w-full"
                  variant="accent"
                  disabled={isSubmitting || !isLoaded}
                >
                  {isSubmitting || !isLoaded ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      {!isLoaded ? "Loading..." : "Sending..."}
                    </span>
                  ) : (
                    "Send Reset Link"
                  )}
                </AnimateButton>
              </form>
            </CardContent>
            <CardFooter className="flex-col gap-3">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Link
                  href="/login"
                  className="flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
                >
                  <ArrowLeft className="size-3.5" />
                  Back to Login
                </Link>
              </motion.div>
              <Separator />
              <div className="flex gap-4 text-xs text-muted-foreground">
                <Link
                  href="/security"
                  className="underline-offset-4 hover:text-primary hover:underline"
                >
                  Security Policy
                </Link>
                <Link
                  href="/help"
                  className="underline-offset-4 hover:text-primary hover:underline"
                >
                  Help Center
                </Link>
              </div>
            </CardFooter>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
