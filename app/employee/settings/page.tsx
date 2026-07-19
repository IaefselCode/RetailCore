"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { toast } from "sonner"
import { Sun, Moon, Bell, Mail, ShoppingCart, Shield } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { AnimateButton } from "@/components/ui/animate-button"
import { AdaptiveSlider } from "@/components/ui/adaptive-slider"

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

export default function EmployeeSettingsPage() {
  const [notifyShift, setNotifyShift] = useState(true)
  const [notifyStock, setNotifyStock] = useState(true)
  const [notifySales, setNotifySales] = useState(false)
  const [language, setLanguage] = useState("en")
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [notificationVolume, setNotificationVolume] = useState(50)

  const saveChanges = () => {
    toast.success("Settings saved successfully")
  }

  const changePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    toast.success("Password changed successfully")
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your preferences</p>
      </motion.div>

      <motion.div
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.05 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>Choose what notifications you receive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Shift Reminders</p>
                  <p className="text-xs text-muted-foreground">Get notified before your shift starts</p>
                </div>
              </div>
              <Switch checked={notifyShift} onCheckedChange={setNotifyShift} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingCart className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Stock Alerts</p>
                  <p className="text-xs text-muted-foreground">Low stock and out-of-stock notifications</p>
                </div>
              </div>
              <Switch checked={notifyStock} onCheckedChange={setNotifyStock} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Sales Reports</p>
                  <p className="text-xs text-muted-foreground">Weekly sales summary via email</p>
                </div>
              </div>
              <Switch checked={notifySales} onCheckedChange={setNotifySales} />
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
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Language and appearance settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Language</Label>
              <Select value={language} onValueChange={(v) => v && setLanguage(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {theme === "light" ? <Sun className="size-4 text-muted-foreground" /> : <Moon className="size-4 text-muted-foreground" />}
                <div>
                  <p className="text-sm font-medium">Theme</p>
                  <p className="text-xs text-muted-foreground">Toggle between light and dark mode</p>
                </div>
              </div>
              <div className="flex items-center gap-1 rounded-lg border p-0.5">
                <Button
                  variant={theme === "light" ? "secondary" : "ghost"}
                  size="icon-sm"
                  onClick={() => setTheme("light")}
                >
                  <Sun className="size-4" />
                </Button>
                <Button
                  variant={theme === "dark" ? "secondary" : "ghost"}
                  size="icon-sm"
                  onClick={() => setTheme("dark")}
                >
                  <Moon className="size-4" />
                </Button>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Notification Volume</Label>
                <span className="text-sm text-muted-foreground">{notificationVolume}%</span>
              </div>
              <AdaptiveSlider
                value={notificationVolume}
                onChange={setNotificationVolume}
                min={0}
                max={100}
                step={1}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.15 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="size-4 text-muted-foreground" />
              <div>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={changePassword}>
              Update Password
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <div className="flex justify-end">
        <AnimateButton variant="accent" onClick={saveChanges}>
          Save Changes
        </AnimateButton>
      </div>
    </div>
  )
}
