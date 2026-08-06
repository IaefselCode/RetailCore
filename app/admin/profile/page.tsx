"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { motion } from "motion/react"
import { ChevronRightIcon, SaveIcon, Edit2Icon, KeyIcon, LogInIcon, ClockIcon } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { AnimateButton } from "@/components/ui/animate-button"

const sectionVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
}

export default function ProfilePage() {
  const t = useTranslations("profile")
  const tc = useTranslations("common")
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState("Admin User")
  const [email, setEmail] = useState("admin@retailcore.com")
  const [phone, setPhone] = useState("+1 (555) 123-4567")

  function handleSave() {
    setEditing(false)
    toast.success(t("saved"))
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

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <Avatar className="size-16">
              <AvatarFallback className="text-lg font-medium bg-primary/10 text-primary">
                AU
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-medium">{name}</h1>
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
          <TabsTrigger value="preferences">{t("preferences")}</TabsTrigger>
        </TabsList>

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
                <Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>
                  <Edit2Icon />
                  {editing ? tc("cancel") : t("edit")}
                </Button>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="full-name">{t("fullName")}</Label>
                    <Input id="full-name" value={name} onChange={(e) => setName(e.target.value)} disabled={!editing} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="email">{t("email")}</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!editing} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="phone">{t("phone")}</Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!editing} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="department">{t("department")}</Label>
                    <Input id="department" defaultValue={t("administration")} disabled />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="role">{t("role")}</Label>
                  <Input id="role" defaultValue={t("adminRole")} disabled />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </motion.div>

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
                    <p className="text-sm text-muted-foreground">Today at 9:42 AM</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <ClockIcon className="size-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{t("passwordChanged")}</p>
                    <p className="text-sm text-muted-foreground">March 15, 2026</p>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-end">
                  <Button variant="outline">
                    <KeyIcon />
                    {t("changePassword")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </motion.div>

        <motion.div
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.15 }}
        >
          <TabsContent value="preferences" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("preferencesTitle")}</CardTitle>
                <CardDescription>{t("preferencesDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">{t("emailNotifications")}</Label>
                    <p className="text-sm text-muted-foreground">{t("emailNotificationsDesc")}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">{t("smsAlerts")}</Label>
                    <p className="text-sm text-muted-foreground">{t("smsAlertsDesc")}</p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">{t("compactDashboard")}</Label>
                    <p className="text-sm text-muted-foreground">{t("compactDashboardDesc")}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </motion.div>
      </Tabs>

      <motion.div
        className="flex justify-end"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        <AnimateButton variant="accent" onClick={handleSave}>
          <SaveIcon />
          {t("saveChanges")}
        </AnimateButton>
      </motion.div>
    </div>
  )
}
