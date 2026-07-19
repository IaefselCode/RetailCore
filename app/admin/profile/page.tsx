"use client"

import { useState } from "react"
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
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState("Admin User")
  const [email, setEmail] = useState("admin@retailcore.com")
  const [phone, setPhone] = useState("+1 (555) 123-4567")

  function handleSave() {
    setEditing(false)
    toast.success("Profile updated successfully")
  }

  return (
    <div className="flex flex-col gap-6">
      <motion.nav
        className="flex items-center gap-1 text-sm text-muted-foreground"
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <span>Home</span>
        <ChevronRightIcon className="size-3.5" />
        <span className="text-foreground">Profile</span>
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
              <p className="text-sm text-muted-foreground">RMS Administrator</p>
              <Badge variant="outline" className="mt-1">Super Admin</Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Tabs defaultValue="personal">
        <TabsList>
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
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
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Manage your profile details</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>
                  <Edit2Icon />
                  {editing ? "Cancel" : "Edit"}
                </Button>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="full-name">Full Name</Label>
                    <Input id="full-name" value={name} onChange={(e) => setName(e.target.value)} disabled={!editing} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!editing} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!editing} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="department">Department</Label>
                    <Input id="department" defaultValue="Administration" disabled />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Input id="role" defaultValue="RMS Administrator (Super Admin)" disabled />
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
                <CardTitle>Security</CardTitle>
                <CardDescription>Account security information</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <LogInIcon className="size-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Last Login</p>
                    <p className="text-sm text-muted-foreground">Today at 9:42 AM</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <ClockIcon className="size-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Password Last Changed</p>
                    <p className="text-sm text-muted-foreground">March 15, 2026</p>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-end">
                  <Button variant="outline">
                    <KeyIcon />
                    Change Password
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
                <CardTitle>Preferences</CardTitle>
                <CardDescription>Customize your experience</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive email updates about your account</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">SMS Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get text messages for critical updates</p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Compact Dashboard</Label>
                    <p className="text-sm text-muted-foreground">Show more information on the dashboard</p>
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
          Save Changes
        </AnimateButton>
      </motion.div>
    </div>
  )
}
