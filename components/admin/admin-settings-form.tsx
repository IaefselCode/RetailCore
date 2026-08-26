"use client"

import { useState, useTransition, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { motion } from "motion/react"
import { ChevronRightIcon, SaveIcon, Loader2, Eye, EyeOff, Check, X, Shield } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { updateSystemSettings } from "@/lib/settings-actions"
import { changeEmployeePassword } from "@/lib/settings-actions"


const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
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

export interface SystemSettingsData {
  shopName: string
  timezone: string
  currency: string
  dateFormat: string
  sessionTimeout: string
}

export function AdminSettingsForm({ initial }: { initial: SystemSettingsData }) {
  const router = useRouter()
  const t = useTranslations("settings")
  const tc = useTranslations("common")
  const tp = useTranslations("employeeSettings")
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState({
    shopName: initial.shopName,
    timezone: initial.timezone,
    currency: initial.currency,
    dateFormat: initial.dateFormat,
    sessionTimeout: initial.sessionTimeout,
  })

  // Password change state
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

  const update = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  function handleSave() {
    const fd = new FormData()
    fd.append("shopName", form.shopName)
    fd.append("timezone", form.timezone)
    fd.append("currency", form.currency)
    fd.append("dateFormat", form.dateFormat)
    fd.append("sessionTimeout", form.sessionTimeout)

    startTransition(async () => {
      const result = await updateSystemSettings(fd)
      if (result.success) {
        toast.success(result.message)
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
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <span>{tc("home")}</span>
        <ChevronRightIcon className="size-3.5" />
        <span className="text-foreground">{t("breadcrumb")}</span>
      </nav>

      <h1 className="text-2xl font-medium">{t("title")}</h1>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">{t("general")}</TabsTrigger>
          <TabsTrigger value="security">{t("security")}</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>{t("generalSettings")}</CardTitle>
                  <CardDescription>{t("generalSettingsDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Currency */}
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="currency">{t("currency")}</Label>
                      <Select value={form.currency} onValueChange={(v) => update("currency", v)}>
                        <SelectTrigger id="currency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="usd">USD ($)</SelectItem>
                          <SelectItem value="eur">EUR (€)</SelectItem>
                          <SelectItem value="gbp">GBP (£)</SelectItem>
                          <SelectItem value="cad">CAD (C$)</SelectItem>
                          <SelectItem value="tzs">TZS (TSh)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Date Format */}
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="date-format">{t("dateFormat")}</Label>
                      <Select value={form.dateFormat} onValueChange={(v) => update("dateFormat", v)}>
                        <SelectTrigger id="date-format">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                          <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
                          <SelectItem value="ymd">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Shield className="size-4 text-muted-foreground" />
                    <div>
                      <CardTitle>{tp("changePassword")}</CardTitle>
                      <CardDescription>{tp("changePasswordDesc")}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {/* Current Password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="admin-current-password">{tp("currentPassword")}</Label>
                    <div className="relative">
                      <Input
                        id="admin-current-password"
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
                    <Label htmlFor="admin-new-password">{tp("newPassword")}</Label>
                    <div className="relative">
                      <Input
                        id="admin-new-password"
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
                    {/* Password Strength */}
                    {newPassword.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{tp("passwordStrength")}</span>
                          <span className={`text-xs font-medium ${strength.score <= 2 ? "text-red-500" : strength.score <= 3 ? "text-orange-500" : strength.score <= 4 ? "text-yellow-600" : "text-green-600"}`}>
                            {strength.label}
                          </span>
                        </div>
                        <Progress value={(strength.score / 5) * 100} className="h-1.5" />
                        <div className="flex gap-2 text-xs text-muted-foreground flex-wrap">
                          <span className={newPassword.length >= 8 ? "text-green-600" : ""}>
                            {newPassword.length >= 8 ? <Check className="inline size-3" /> : <X className="inline size-3" />}
                            {" "}{tp("minLength")}
                          </span>
                          <span className={/[A-Z]/.test(newPassword) ? "text-green-600" : ""}>
                            {/[A-Z]/.test(newPassword) ? <Check className="inline size-3" /> : <X className="inline size-3" />}
                            {" "}{tp("uppercase")}
                          </span>
                          <span className={/[a-z]/.test(newPassword) ? "text-green-600" : ""}>
                            {/[a-z]/.test(newPassword) ? <Check className="inline size-3" /> : <X className="inline size-3" />}
                            {" "}{tp("lowercase")}
                          </span>
                          <span className={/\d/.test(newPassword) ? "text-green-600" : ""}>
                            {/\d/.test(newPassword) ? <Check className="inline size-3" /> : <X className="inline size-3" />}
                            {" "}{tp("number")}
                          </span>
                          <span className={/[^A-Za-z0-9]/.test(newPassword) ? "text-green-600" : ""}>
                            {/[^A-Za-z0-9]/.test(newPassword) ? <Check className="inline size-3" /> : <X className="inline size-3" />}
                            {" "}{tp("symbol")}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="admin-confirm-password">{tp("confirmNewPassword")}</Label>
                    <div className="relative">
                      <Input
                        id="admin-confirm-password"
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
                          <><Check className="inline size-3" /> {tp("passwordsMatch")}</>
                        ) : (
                          <><X className="inline size-3" /> {tp("passwordMismatch")}</>
                        )}
                      </p>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    onClick={handleChangePassword}
                    disabled={!canChangePassword}
                  >
                    {changingPassword ? (
                      <><Loader2 className="mr-2 size-4 animate-spin" /> {tp("changing")}</>
                    ) : (
                      tp("updatePassword")
                    )}
                  </Button>

                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <AnimateButton onClick={handleSave} disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <SaveIcon />}
          {t("saveChanges")}
        </AnimateButton>
      </div>
    </div>
  )
}
