"use client"

import { useState, useTransition, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { motion } from "motion/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  ChevronRightIcon,
  SaveIcon,
  Edit2Icon,
  KeyIcon,
  LogInIcon,
  ClockIcon,
  Loader2,
  Eye,
  EyeOff,
  Check,
  X,
  Shield,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { AnimateButton } from "@/components/ui/animate-button"
import { ImageUpload } from "@/components/ui/image-upload"
import { updateAdminProfile, updateProfilePhoto, type AdminProfileData } from "@/lib/profile-actions"
import { changeEmployeePassword } from "@/lib/settings-actions"
import { type ActionResult } from "@/lib/actions"
import { useFormattedDate } from "@/components/providers/date-format-provider"

const sectionVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
}

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/\d/, "Password must include a number")
  .regex(/[^A-Za-z0-9]/, "Password must include a symbol")

function buildPasswordSchema(t: (key: string) => string) {
  return z
    .object({
      currentPassword: z.string().min(1, t("currentPassword")),
      newPassword: passwordSchema,
      confirmPassword: z.string(),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
      message: t("passwordMismatch"),
      path: ["confirmPassword"],
    })
    .refine((d) => d.currentPassword !== d.newPassword, {
      message: "New password must be different from current password",
      path: ["newPassword"],
    })
}

type PasswordForm = z.infer<ReturnType<typeof buildPasswordSchema>>

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

function formatDate(iso: string | null, fmtDate: (d: Date | string | number | null | undefined) => string): string {
  if (!iso) return "—"
  return fmtDate(iso)
}

export function AdminProfileForm({ profile }: { profile: AdminProfileData }) {
  const router = useRouter()
  const t = useTranslations("profile")
  const tc = useTranslations("common")
  const tp = useTranslations("employeeSettings")
  const fmtDate = useFormattedDate()

  const { update: updateSession } = useSession()
  const [editing, setEditing] = useState(false)
  const [pending, startTransition] = useTransition()
  const [imageUrl, setImageUrl] = useState<string | null>(profile.imageUrl)
  const [form, setForm] = useState({
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    phone: profile.phone ?? "",
  })

  // Password change form (react-hook-form + zod)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  const {
    register,
    watch,
    handleSubmit,
    reset: resetPasswordForm,
    formState: { errors: pwErrors, dirtyFields: pwDirty },
  } = useForm<PasswordForm>({
    resolver: zodResolver(buildPasswordSchema(tp)),
    mode: "onChange",
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  })

  const newPasswordVal = watch("newPassword")
  const confirmPasswordVal = watch("confirmPassword")
  const strength = passwordStrength(newPasswordVal)
  const passwordsMatch =
    pwDirty.confirmPassword && newPasswordVal === confirmPasswordVal && newPasswordVal.length > 0

  const hasMinLen = newPasswordVal.length >= 8
  const hasUpper = /[A-Z]/.test(newPasswordVal)
  const hasLower = /[a-z]/.test(newPasswordVal)
  const hasNumber = /\d/.test(newPasswordVal)
  const hasSymbol = /[^A-Za-z0-9]/.test(newPasswordVal)

  const initials =
    [form.firstName?.[0], form.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?"

  const hasChanges =
    form.firstName !== profile.firstName ||
    form.lastName !== profile.lastName ||
    form.email !== profile.email ||
    form.phone !== (profile.phone ?? "") ||
    imageUrl !== profile.imageUrl

  const handlePhotoChange = useCallback(
    async (url: string | null) => {
      setImageUrl(url)
      const result = await updateProfilePhoto(url)
      if (result.success) {
        await updateSession({ user: { image: url ?? undefined } })
        router.refresh()
      } else {
        toast.error("Failed to save photo")
      }
    },
    [updateSession, router]
  )

  function handleSave() {
    const fd = new FormData()
    fd.append("firstName", form.firstName)
    fd.append("lastName", form.lastName)
    fd.append("email", form.email)
    fd.append("phone", form.phone)
    fd.append("imageUrl", imageUrl ?? "")

    startTransition(async () => {
      const result = await updateAdminProfile(null, fd)
      if (result.success) {
        toast.success(t("saved"))
        setEditing(false)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  const handleChangePassword = async (data: PasswordForm) => {
    setChangingPassword(true)
    try {
      const result = await changeEmployeePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
      if (result.success) {
        toast.success(result.message)
        resetPasswordForm()
        setShowPasswordForm(false)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error(tp("somethingWentWrong"))
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <motion.nav
        className="flex items-center gap-1 text-sm text-muted-foreground"
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <span>{tc("home")}</span>
        <ChevronRightIcon className="size-3.5" />
        <span className="text-foreground">{t("breadcrumb")}</span>
      </motion.nav>

      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative">
                <Avatar className="size-20">
                  {imageUrl ? (
                    <AvatarImage
                      src={imageUrl}
                      alt={`${form.firstName} ${form.lastName}`}
                    />
                  ) : null}
                  <AvatarFallback className="text-xl font-medium bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-xl font-medium">
                  {form.firstName} {form.lastName}
                </h1>
                <p className="text-sm text-muted-foreground">{t("adminRole")}</p>
                <Badge variant="outline" className="mt-1">{t("superAdmin")}</Badge>
              </div>
            </div>
            <div className="mt-4 flex justify-center sm:justify-start">
              <ImageUpload
                value={imageUrl}
                onChange={handlePhotoChange}
                folder="profiles"
                maxDim={400}
                quality={0.72}
                hidePreview
                enableCrop
                roundCrop
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Tabs defaultValue="personal">
        <TabsList>
          <TabsTrigger value="personal">{t("personalInfo")}</TabsTrigger>
          <TabsTrigger value="security">{t("security")}</TabsTrigger>
        </TabsList>

        {/* Personal Info Tab */}
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.05 }}
        >
          <TabsContent value="personal" className="mt-6">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle>{t("personalInformation")}</CardTitle>
                  <CardDescription>{t("manageProfile")}</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (editing) {
                      // Reset form to original values on cancel
                      setForm({
                        firstName: profile.firstName,
                        lastName: profile.lastName,
                        email: profile.email,
                        phone: profile.phone ?? "",
                      })
                      setImageUrl(profile.imageUrl)
                    }
                    setEditing(!editing)
                  }}
                >
                  <Edit2Icon />
                  {editing ? tc("cancel") : t("edit")}
                </Button>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="first-name">{t("firstName")}</Label>
                    <Input
                      id="first-name"
                      value={form.firstName}
                      onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                      disabled={!editing}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="last-name">{t("lastName")}</Label>
                    <Input
                      id="last-name"
                      value={form.lastName}
                      onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                      disabled={!editing}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="email">{t("email")}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      disabled={!editing}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="phone">{t("phone")}</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      disabled={!editing}
                      placeholder="+255 700 000 000"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="department">{t("department")}</Label>
                    <Input id="department" defaultValue={t("administration")} disabled />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="role">{t("role")}</Label>
                    <Input id="role" defaultValue={t("adminRole")} disabled />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </motion.div>

        {/* Security Tab */}
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.1 }}
        >
          <TabsContent value="security" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("securityTitle")}</CardTitle>
                <CardDescription>{t("securityDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <LogInIcon className="size-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{t("lastLogin")}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(profile.lastLogin, fmtDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <ClockIcon className="size-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{t("passwordChanged")}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(profile.lastPasswordChange, fmtDate)}
                    </p>
                  </div>
                </div>
                <Separator />

                {/* Change Password Form */}
                {!showPasswordForm ? (
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={() => setShowPasswordForm(true)}>
                      <KeyIcon />
                      {t("changePassword")}
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); void handleSubmit(handleChangePassword)(e) }} className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <Shield className="size-4 text-muted-foreground" />
                      <p className="text-sm font-medium">{t("changePassword")}</p>
                    </div>

                    {/* Current Password */}
                    <div className="space-y-1.5">
                      <Label htmlFor="profile-current-password">{tp("currentPassword")}</Label>
                      <div className="relative">
                        <Input
                          id="profile-current-password"
                          type={showCurrent ? "text" : "password"}
                          placeholder={tp("currentPassword")}
                          {...register("currentPassword")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrent(!showCurrent)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                      {pwErrors.currentPassword && (
                        <p className="text-xs text-destructive">{pwErrors.currentPassword.message}</p>
                      )}
                    </div>

                    {/* New Password */}
                    <div className="space-y-1.5">
                      <Label htmlFor="profile-new-password">{tp("newPassword")}</Label>
                      <div className="relative">
                        <Input
                          id="profile-new-password"
                          type={showNew ? "text" : "password"}
                          placeholder={tp("newPassword")}
                          {...register("newPassword")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNew(!showNew)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                      {newPasswordVal.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {tp("passwordStrength")}
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
                              {" "}{tp("minLength")}
                            </span>
                            <span className={hasUpper ? "text-green-600" : ""}>
                              {hasUpper ? <Check className="inline size-3" /> : <X className="inline size-3" />}
                              {" "}{tp("uppercase")}
                            </span>
                            <span className={hasLower ? "text-green-600" : ""}>
                              {hasLower ? <Check className="inline size-3" /> : <X className="inline size-3" />}
                              {" "}{tp("lowercase")}
                            </span>
                            <span className={hasNumber ? "text-green-600" : ""}>
                              {hasNumber ? <Check className="inline size-3" /> : <X className="inline size-3" />}
                              {" "}{tp("number")}
                            </span>
                            <span className={hasSymbol ? "text-green-600" : ""}>
                              {hasSymbol ? <Check className="inline size-3" /> : <X className="inline size-3" />}
                              {" "}{tp("symbol")}
                            </span>
                          </div>
                        </div>
                      )}
                      {pwErrors.newPassword && (
                        <p className="text-xs text-destructive">{pwErrors.newPassword.message}</p>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                      <Label htmlFor="profile-confirm-password">{tp("confirmNewPassword")}</Label>
                      <div className="relative">
                        <Input
                          id="profile-confirm-password"
                          type={showConfirm ? "text" : "password"}
                          placeholder={tp("confirmNewPassword")}
                          {...register("confirmPassword")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                      {pwDirty.confirmPassword && confirmPasswordVal.length > 0 && (
                        <p className={`text-xs ${passwordsMatch ? "text-green-600" : "text-red-500"}`}>
                          {passwordsMatch ? (
                            <>
                              <Check className="inline size-3" /> {tp("passwordsMatch")}
                            </>
                          ) : (
                            <>
                              <X className="inline size-3" /> {tp("passwordMismatch")}
                            </>
                          )}
                        </p>
                      )}
                      {pwErrors.confirmPassword && (
                        <p className="text-xs text-destructive">{pwErrors.confirmPassword.message}</p>
                      )}
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => {
                          setShowPasswordForm(false)
                          resetPasswordForm()
                        }}
                      >
                        {tc("cancel")}
                      </Button>
                      <Button type="submit" disabled={changingPassword}>
                        {changingPassword ? (
                          <>
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            {tp("changing")}
                          </>
                        ) : (
                          tp("updatePassword")
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </motion.div>
      </Tabs>

      {/* Save Button */}
      {editing && (
        <motion.div
          className="flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <AnimateButton variant="accent" onClick={handleSave} disabled={pending || !hasChanges}>
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <SaveIcon />
            )}
            {t("saveChanges")}
          </AnimateButton>
        </motion.div>
      )}
    </div>
  )
}
