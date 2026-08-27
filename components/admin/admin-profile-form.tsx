"use client"

import { useState, useTransition, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { motion } from "motion/react"
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
import { AnimateButton } from "@/components/ui/animate-button"
import { updateAdminProfile, type AdminProfileData } from "@/lib/profile-actions"
import { changeEmployeePassword } from "@/lib/settings-actions"
import { type ActionResult } from "@/lib/actions"
import { useFormattedDate } from "@/components/providers/date-format-provider"

const sectionVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
}

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

  const [editing, setEditing] = useState(false)
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState({
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    phone: profile.phone ?? "",
  })

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  const strength = useMemo(() => passwordStrength(newPassword), [newPassword])
  const passwordsMatch = newPassword.length > 0 && confirmPassword.length > 0 && newPassword === confirmPassword
  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword

  const canChangePassword =
    currentPassword.length > 0 &&
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    newPassword === confirmPassword &&
    !changingPassword

  const initials =
    [form.firstName?.[0], form.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?"

  const hasChanges =
    form.firstName !== profile.firstName ||
    form.lastName !== profile.lastName ||
    form.email !== profile.email ||
    form.phone !== (profile.phone ?? "")

  function handleSave() {
    const fd = new FormData()
    fd.append("firstName", form.firstName)
    fd.append("lastName", form.lastName)
    fd.append("email", form.email)
    fd.append("phone", form.phone)
    fd.append("imageUrl", profile.imageUrl ?? "")

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

  const handleChangePassword = async () => {
    if (!canChangePassword) return

    setChangingPassword(true)
    try {
      const result = await changeEmployeePassword({
        currentPassword,
        newPassword,
      })
      if (result.success) {
        toast.success(result.message)
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
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
          <CardContent className="flex items-center gap-4 pt-6">
            <Avatar className="size-16">
              {profile.imageUrl ? (
                <AvatarImage
                  src={profile.imageUrl}
                  alt={`${form.firstName} ${form.lastName}`}
                />
              ) : null}
              <AvatarFallback className="text-lg font-medium bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-medium">
                {form.firstName} {form.lastName}
              </h1>
              <p className="text-sm text-muted-foreground">{t("adminRole")}</p>
              <Badge variant="outline" className="mt-1">{t("superAdmin")}</Badge>
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
                  <div className="flex flex-col gap-4">
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
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder={tp("currentPassword")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrent(!showCurrent)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div className="space-y-1.5">
                      <Label htmlFor="profile-new-password">{tp("newPassword")}</Label>
                      <div className="relative">
                        <Input
                          id="profile-new-password"
                          type={showNew ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder={tp("newPassword")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNew(!showNew)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                      {newPassword.length > 0 && (
                        <div className="space-y-1 pt-1">
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
                            <span className={newPassword.length >= 8 ? "text-green-600" : ""}>
                              {newPassword.length >= 8 ? (
                                <Check className="inline size-3" />
                              ) : (
                                <X className="inline size-3" />
                              )}{" "}
                              {tp("minLength")}
                            </span>
                            <span className={/[A-Z]/.test(newPassword) ? "text-green-600" : ""}>
                              {/[A-Z]/.test(newPassword) ? (
                                <Check className="inline size-3" />
                              ) : (
                                <X className="inline size-3" />
                              )}{" "}
                              {tp("uppercase")}
                            </span>
                            <span className={/[a-z]/.test(newPassword) ? "text-green-600" : ""}>
                              {/[a-z]/.test(newPassword) ? (
                                <Check className="inline size-3" />
                              ) : (
                                <X className="inline size-3" />
                              )}{" "}
                              {tp("lowercase")}
                            </span>
                            <span className={/\d/.test(newPassword) ? "text-green-600" : ""}>
                              {/\d/.test(newPassword) ? (
                                <Check className="inline size-3" />
                              ) : (
                                <X className="inline size-3" />
                              )}{" "}
                              {tp("number")}
                            </span>
                            <span className={/[^A-Za-z0-9]/.test(newPassword) ? "text-green-600" : ""}>
                              {/[^A-Za-z0-9]/.test(newPassword) ? (
                                <Check className="inline size-3" />
                              ) : (
                                <X className="inline size-3" />
                              )}{" "}
                              {tp("symbol")}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                      <Label htmlFor="profile-confirm-password">{tp("confirmNewPassword")}</Label>
                      <div className="relative">
                        <Input
                          id="profile-confirm-password"
                          type={showConfirm ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder={tp("confirmNewPassword")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                      {confirmPassword.length > 0 && (
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
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowPasswordForm(false)
                          setCurrentPassword("")
                          setNewPassword("")
                          setConfirmPassword("")
                        }}
                      >
                        {tc("cancel")}
                      </Button>
                      <Button onClick={handleChangePassword} disabled={!canChangePassword}>
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
                  </div>
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
