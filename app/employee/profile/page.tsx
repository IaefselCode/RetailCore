"use client"

import { motion } from "motion/react"
import { useTranslations } from "next-intl"
import { Mail, Phone, Store, DollarSign, Star, Calendar, Edit3 } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { AnimateButton } from "@/components/ui/animate-button"

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

export default function EmployeeProfilePage() {
  const t = useTranslations("employeeProfile")
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="size-20">
                <AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary">
                  AR
                </AvatarFallback>
              </Avatar>
              <h1 className="mt-4 text-xl font-semibold">Alex Rivera</h1>
              <p className="text-sm text-muted-foreground">{t("staffLevel")}</p>
              <AnimateButton className="mt-4" size="sm">
                <Edit3 className="size-4" />
                {t("editProfile")}
              </AnimateButton>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>{t("contactInformation")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                <Mail className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">{t("email")}</p>
                <p className="text-sm text-muted-foreground">alex.rivera@retailcore.com</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                <Phone className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">{t("phone")}</p>
                <p className="text-sm text-muted-foreground">+1 (555) 234-5678</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                <Store className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">{t("shopAssignment")}</p>
                <p className="text-sm text-muted-foreground">Downtown Flagship Store</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>{t("activityStats")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-green-500/10 text-green-600">
                  <DollarSign className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{t("totalSalesThisMonth")}</p>
                </div>
              </div>
              <span className="text-lg font-bold">$12,450</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                  <Star className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{t("rating")}</p>
                </div>
              </div>
              <span className="text-lg font-bold">4.8/5</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                  <Calendar className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{t("yearsOfService")}</p>
                </div>
              </div>
              <span className="text-lg font-bold">2</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
