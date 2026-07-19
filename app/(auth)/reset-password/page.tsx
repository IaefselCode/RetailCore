"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react"
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
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

const resetSchema = z
  .object({
    code: z.string().min(6, "Enter the verification code"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[a-z]/, "Include at least one lowercase letter")
      .regex(/[A-Z]/, "Include at least one uppercase letter")
      .regex(/\d/, "Include at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type ResetForm = z.infer<typeof resetSchema>

function getPasswordStrength(password: string): number {
  let score = 0
  if (password.length >= 8) score += 25
  if (/[a-z]/.test(password)) score += 25
  if (/[A-Z]/.test(password)) score += 25
  if (/\d/.test(password)) score += 15
  if (/[^a-zA-Z0-9]/.test(password)) score += 10
  return Math.min(score, 100)
}

function getStrengthLabel(strength: number): string {
  if (strength === 0) return ""
  if (strength <= 25) return "Weak"
  if (strength <= 50) return "Fair"
  if (strength <= 75) return "Good"
  return "Strong"
}

function getStrengthColor(strength: number): string {
  if (strength <= 25) return "text-red-500"
  if (strength <= 50) return "text-yellow-500"
  if (strength <= 75) return "text-blue-500"
  return "text-green-500"
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [resetComplete, setResetComplete] = useState(false)
  const { isLoaded, signIn, setActive } = useSignIn()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    defaultValues: { code: "", password: "", confirmPassword: "" },
  })

  const password = watch("password")
  const strength = useMemo(() => getPasswordStrength(password ?? ""), [password])
  const strengthLabel = getStrengthLabel(strength)
  const showStrength = (password ?? "").length > 0

  const requirements = [
    { label: "At least 8 characters", met: (password ?? "").length >= 8 },
    { label: "One lowercase letter", met: /[a-z]/.test(password ?? "") },
    { label: "One uppercase letter", met: /[A-Z]/.test(password ?? "") },
    { label: "One number", met: /\d/.test(password ?? "") },
  ]

  async function onSubmit(data: ResetForm) {
    if (!isLoaded || !signIn) return

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: data.code,
        password: data.password,
      })

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId })
        setResetComplete(true)
        toast.success("Password reset successfully")
      } else {
        toast.error("Something went wrong. Please try again.")
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to reset password. Please check your code and try again."
      toast.error(message)
    }
  }

  if (resetComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Password Updated</CardTitle>
          <CardDescription>
            Your password has been reset successfully. You can now sign in with your
            new password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login">
            <AnimateButton variant="accent" className="w-full">
              <ArrowLeft className="size-4" />
              Sign in
            </AnimateButton>
          </Link>
        </CardContent>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <CardHeader>
        <CardTitle className="text-xl">Set New Password</CardTitle>
        <CardDescription>
          Enter the verification code from your email and create a new password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              type="text"
              placeholder="Enter the code from your email"
              {...register("code")}
              aria-invalid={!!errors.code}
            />
            {errors.code && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-destructive"
              >
                {errors.code.message}
              </motion.p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                {...register("password")}
                aria-invalid={!!errors.password}
                className="pr-10"
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
            {errors.password && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-destructive"
              >
                {errors.password.message}
              </motion.p>
            )}
          </div>

          {showStrength && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className={getStrengthColor(strength)}>{strengthLabel}</span>
                <span className="text-muted-foreground">{strength}%</span>
              </div>
              <Progress value={strength}>
                <ProgressTrack>
                  <ProgressIndicator />
                </ProgressTrack>
              </Progress>
              <ul className="space-y-0.5">
                {requirements.map((req) => (
                  <li
                    key={req.label}
                    className={`flex items-center gap-1.5 text-[11px] ${
                      req.met ? "text-green-600" : "text-muted-foreground"
                    }`}
                  >
                    <span>{req.met ? "✓" : "○"}</span>
                    {req.label}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm new password"
                {...register("confirmPassword")}
                aria-invalid={!!errors.confirmPassword}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-destructive"
              >
                {errors.confirmPassword.message}
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
                {!isLoaded ? "Loading..." : "Resetting..."}
              </span>
            ) : (
              "Reset Password"
            )}
          </AnimateButton>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-3">
        <Link
          href="/login"
          className="flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
        >
          <ArrowLeft className="size-3.5" />
          Return to Login
        </Link>
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
  )
}
