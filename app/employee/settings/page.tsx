"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { motion } from "motion/react"
import { toast } from "sonner"
import { Shield, Eye, EyeOff, Check, X, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { changeEmployeePassword } from "@/lib/settings-actions"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/\d/, "Password must include a number")
  .regex(/[^A-Za-z0-9]/, "Password must include a symbol")

const buildSchema = (t: (key: string) => string) =>
  z
    .object({
      currentPassword: z.string().min(1, t("fillPasswordFields")),
      newPassword: passwordSchema,
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t("passwordMismatch"),
      path: ["confirmPassword"],
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
      message: "New password must be different from current password",
      path: ["newPassword"],
    })

type PasswordForm = z.infer<ReturnType<typeof buildSchema>>

function passwordStrength(pw: string): { score: number; label: string } {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[a-z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 2) return { score, label: "Weak" }
  if (score <= 3) return { score, label: "Fair" }
  if (score <= 4) return { score, label: "Good" }
  return { score, label: "Strong" }
}

export default function EmployeeSettingsPage() {
  const t = useTranslations("employeeSettings")

  const {
    register,
    watch,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<PasswordForm>({
    resolver: zodResolver(buildSchema(t)),
    mode: "onChange",
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  })

  const newPassword = watch("newPassword")
  const confirmPassword = watch("confirmPassword")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [changing, setChanging] = useState(false)

  const strength = passwordStrength(newPassword)
  const passwordsMatch = dirtyFields.confirmPassword && newPassword === confirmPassword && newPassword.length > 0

  const hasMinLen = newPassword.length >= 8
  const hasUpper = /[A-Z]/.test(newPassword)
  const hasLower = /[a-z]/.test(newPassword)
  const hasNumber = /\d/.test(newPassword)
  const hasSymbol = /[^A-Za-z0-9]/.test(newPassword)

  async function onSubmit(data: PasswordForm) {
    setChanging(true)
    try {
      const result = await changeEmployeePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
      if (result.success) {
        toast.success(result.message)
        reset()
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error(t("somethingWentWrong"))
    } finally {
      setChanging(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </motion.div>

      <motion.div
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="size-4 text-muted-foreground" />
              <div>
                <CardTitle>{t("changePassword")}</CardTitle>
                <CardDescription>{t("changePasswordDesc")}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Current Password */}
              <div className="space-y-1.5">
                <Label htmlFor="current-password">{t("currentPassword")}</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrent ? "text" : "password"}
                    placeholder={t("currentPassword")}
                    {...register("currentPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="text-xs text-destructive">{errors.currentPassword.message}</p>
                )}
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <Label htmlFor="new-password">{t("newPassword")}</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNew ? "text" : "password"}
                    placeholder={t("newPassword")}
                    {...register("newPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {newPassword.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{t("passwordStrength")}</span>
                      <span className={`text-xs font-medium ${strength.score <= 2 ? "text-red-500" : strength.score <= 3 ? "text-orange-500" : strength.score <= 4 ? "text-yellow-600" : "text-green-600"}`}>
                        {strength.label}
                      </span>
                    </div>
                    <Progress value={(strength.score / 5) * 100} className="h-1.5" />
                    <div className="flex gap-2 text-xs text-muted-foreground flex-wrap">
                      <span className={hasMinLen ? "text-green-600" : ""}>
                        {hasMinLen ? <Check className="inline size-3" /> : <X className="inline size-3" />}
                        {" "}{t("minLength")}
                      </span>
                      <span className={hasUpper ? "text-green-600" : ""}>
                        {hasUpper ? <Check className="inline size-3" /> : <X className="inline size-3" />}
                        {" "}{t("uppercase")}
                      </span>
                      <span className={hasLower ? "text-green-600" : ""}>
                        {hasLower ? <Check className="inline size-3" /> : <X className="inline size-3" />}
                        {" "}{t("lowercase")}
                      </span>
                      <span className={hasNumber ? "text-green-600" : ""}>
                        {hasNumber ? <Check className="inline size-3" /> : <X className="inline size-3" />}
                        {" "}{t("number")}
                      </span>
                      <span className={hasSymbol ? "text-green-600" : ""}>
                        {hasSymbol ? <Check className="inline size-3" /> : <X className="inline size-3" />}
                        {" "}{t("symbol")}
                      </span>
                    </div>
                  </div>
                )}
                {errors.newPassword && (
                  <p className="text-xs text-destructive">{errors.newPassword.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">{t("confirmNewPassword")}</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirm ? "text" : "password"}
                    placeholder={t("confirmNewPassword")}
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
                      <><Check className="inline size-3" /> {t("passwordsMatch")}</>
                    ) : (
                      <><X className="inline size-3" /> {t("passwordMismatch")}</>
                    )}
                  </p>
                )}
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Button type="submit" variant="outline" disabled={changing}>
                {changing ? (
                  <><Loader2 className="mr-2 size-4 animate-spin" /> {t("changing")}</>
                ) : (
                  t("updatePassword")
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
