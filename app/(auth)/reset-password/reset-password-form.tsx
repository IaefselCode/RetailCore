"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Eye, EyeOff, Loader2, Check, X, Shield } from "lucide-react"
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
import { Progress } from "@/components/ui/progress"
import { resetPasswordFromForm } from "@/lib/reset-actions"

// --- Zod schema with strict password rules ---
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/\d/, "Password must include a number")
  .regex(/[^A-Za-z0-9]/, "Password must include a symbol")

const buildSchema = () =>
  z
    .object({
      password: passwordSchema,
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    })

type ResetForm = z.infer<ReturnType<typeof buildSchema>>

// --- Password strength calculator ---
function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[a-z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++

  if (score <= 2) return { score, label: "Weak", color: "bg-red-500" }
  if (score <= 3) return { score, label: "Fair", color: "bg-orange-500" }
  if (score <= 4) return { score, label: "Good", color: "bg-yellow-500" }
  return { score, label: "Strong", color: "bg-green-500" }
}

const initialState = { success: false, message: "" }

export function ResetPasswordForm({ token }: { token: string }) {
  const [serverState, setServerState] = useState(initialState)
  const [pending, setPending] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    register,
    watch,
    formState: { errors, dirtyFields, isValid },
  } = useForm<ResetForm>({
    resolver: zodResolver(buildSchema()),
    mode: "onChange",
    defaultValues: { password: "", confirmPassword: "" },
  })

  const password = watch("password")
  const confirmPassword = watch("confirmPassword")
  const strength = passwordStrength(password)

  const hasMinLen = password.length >= 8
  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSymbol = /[^A-Za-z0-9]/.test(password)
  const passwordsMatch = dirtyFields.confirmPassword && password === confirmPassword && password.length > 0

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!isValid) return

    setPending(true)
    try {
      const fd = new FormData()
      fd.append("token", token)
      fd.append("password", password)
      const result = await resetPasswordFromForm(initialState, fd)
      setServerState(result)
    } catch {
      setServerState({ success: false, message: "Something went wrong. Please try again." })
    } finally {
      setPending(false)
    }
  }

  if (serverState.success) {
    return (
      <Card className="shadow-none">
        <CardContent className="space-y-4">
          <p className="text-sm text-emerald-600">{serverState.message}</p>
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
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <input type="hidden" name="token" value={token} />

            {/* New Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password">New password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  className="pr-10"
                  {...register("password")}
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

              {/* Real-time strength indicator */}
              {password.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Shield className="size-3" />
                      Password strength
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        strength.score <= 2
                          ? "text-red-500"
                          : strength.score <= 3
                            ? "text-orange-500"
                            : strength.score <= 4
                              ? "text-yellow-600"
                              : "text-green-600"
                      }`}
                    >
                      {strength.label}
                    </span>
                  </div>
                  <Progress value={(strength.score / 5) * 100} className="h-1.5" />
                  <div className="flex gap-2 text-xs text-muted-foreground flex-wrap">
                    <span className={hasMinLen ? "text-green-600" : ""}>
                      {hasMinLen ? <Check className="inline size-3" /> : <X className="inline size-3" />}
                      {" "}8+ chars
                    </span>
                    <span className={hasUpper ? "text-green-600" : ""}>
                      {hasUpper ? <Check className="inline size-3" /> : <X className="inline size-3" />}
                      {" "}A-Z
                    </span>
                    <span className={hasLower ? "text-green-600" : ""}>
                      {hasLower ? <Check className="inline size-3" /> : <X className="inline size-3" />}
                      {" "}a-z
                    </span>
                    <span className={hasNumber ? "text-green-600" : ""}>
                      {hasNumber ? <Check className="inline size-3" /> : <X className="inline size-3" />}
                      {" "}0-9
                    </span>
                    <span className={hasSymbol ? "text-green-600" : ""}>
                      {hasSymbol ? <Check className="inline size-3" /> : <X className="inline size-3" />}
                      {" "}!@#$
                    </span>
                  </div>
                </div>
              )}

              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter your password"
                  className="pr-10"
                  {...register("confirmPassword")}
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
              {dirtyFields.confirmPassword && confirmPassword.length > 0 && (
                <p className={`text-xs ${passwordsMatch ? "text-green-600" : "text-red-500"}`}>
                  {passwordsMatch ? (
                    <>
                      <Check className="inline size-3" /> Passwords match
                    </>
                  ) : (
                    <>
                      <X className="inline size-3" /> Passwords do not match
                    </>
                  )}
                </p>
              )}
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Server error */}
            {serverState.message && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-destructive"
              >
                {serverState.message}
              </motion.p>
            )}

            <AnimateButton
              type="submit"
              className="w-full"
              variant="accent"
              disabled={pending || !isValid}
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
