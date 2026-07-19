'use client'

import { motion } from "motion/react"
import { use, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AnimateButton } from "@/components/ui/animate-button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Progress, ProgressIndicator, ProgressLabel, ProgressValue } from "@/components/ui/progress"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"
import {
  MapPin,
  Mail,
  Phone,
  Store,
  ArrowLeft,
  ChevronRight,
  Target,
  Trophy,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
}

const employee = {
  id: "1",
  name: "Sarah Connor",
  role: "Store Manager",
  department: "Management",
  email: "sarah.connor@retailcore.com",
  phone: "+1-555-0101",
  location: "Central Plaza Hub",
  status: "Active" as const,
  hireDate: "March 15, 2024",
  salesTarget: 120000,
  salesAchieved: 98500,
  achievements: [
    "Employee of the Month — June 2025",
    "Top Performer Q4 2025",
    "5-Star Customer Service Award",
  ],
}

const initials = employee.name
  .split(" ")
  .map((n) => n[0])
  .join("")

export default function EmployeeDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/admin/employees" className="hover:text-foreground">Employees</Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">{employee.name}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="size-14">
            <AvatarFallback className="text-sm font-medium">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{employee.name}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{employee.role}</span>
              <span className="text-border">|</span>
              <span>{employee.department}</span>
              <Badge>{employee.status}</Badge>
            </div>
          </div>
        </div>
        <AnimateButton variant="outline" asChild>
          <Link href="/admin/employees">
            <ArrowLeft /> Back to Employees
          </Link>
        </AnimateButton>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="sales-history">Sales History</TabsTrigger>
        </TabsList>

        <motion.div
          key="tabs"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <TabsContent value="overview" className="mt-4 space-y-6">
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Full Name</p>
                      <p className="text-sm font-medium">{employee.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Department</p>
                      <p className="text-sm font-medium">{employee.department}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Role</p>
                      <p className="text-sm font-medium">{employee.role}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Hire Date</p>
                      <p className="text-sm font-medium">{employee.hireDate}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Contact</p>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="size-4 text-muted-foreground" />
                      {employee.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="size-4 text-muted-foreground" />
                      {employee.phone}
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Shop Assignment</p>
                    <div className="flex items-center gap-2 text-sm">
                      <Store className="size-4 text-muted-foreground" />
                      <Link href="/admin/shops/1" className="hover:underline">
                        {employee.location}
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="performance" className="mt-4 space-y-6">
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Sales Targets</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="size-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Annual Target</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        ${employee.salesAchieved.toLocaleString()} / ${employee.salesTarget.toLocaleString()}
                      </span>
                    </div>
                    <Progress value={(employee.salesAchieved / employee.salesTarget) * 100}>
                      <ProgressLabel className="sr-only">Progress</ProgressLabel>
                      <ProgressValue />
                    </Progress>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Achievements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {employee.achievements.map((achievement) => (
                    <div key={achievement} className="flex items-center gap-3 rounded-lg border p-3">
                      <Trophy className="size-5 text-amber-500" />
                      <div>
                        <p className="text-sm font-medium">{achievement}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="sales-history" className="mt-4 space-y-6">
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Sales History</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Sales history data will be displayed here.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </motion.div>
      </Tabs>
    </div>
  )
}
