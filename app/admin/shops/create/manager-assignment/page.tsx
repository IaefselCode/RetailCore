'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button as AnimatedButton } from "@/components/ui/animated-button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  ChevronLeft,
  Home,
  Check,
} from "lucide-react"
import Link from "next/link"

const employees = [
  { id: "1", name: "Sarah Connor", role: "Store Manager" },
  { id: "2", name: "John Miller", role: "Store Manager" },
  { id: "3", name: "Emma Wilson", role: "Assistant Manager" },
  { id: "4", name: "Mike Chen", role: "Store Manager" },
  { id: "5", name: "Lisa Park", role: "Assistant Manager" },
  { id: "6", name: "James Rodriguez", role: "Sales Associate" },
]

export default function ManagerAssignmentPage() {
  const router = useRouter()
  const [manager, setManager] = useState("")

  function handleSubmit() {
    if (!manager) {
      toast.error("Please select a manager")
      return
    }
    toast.success("Shop created successfully!")
    router.push("/admin/shops")
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Home className="size-3.5" />
        <Link href="/admin" className="hover:text-foreground">Dashboard</Link>
        <ChevronLeft className="size-3.5" />
        <Link href="/admin/shops" className="hover:text-foreground">Shops</Link>
        <ChevronLeft className="size-3.5" />
        <span className="text-foreground">Create Shop</span>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Create New Shop</CardTitle>
              <CardDescription>Step 2 of 2: Manager Assignment</CardDescription>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
              2
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="manager">Assign Manager</Label>
            <Select value={manager} onValueChange={(v) => setManager(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Available Employees</SelectLabel>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name} — {emp.role}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <AnimatedButton variant="outline" asChild>
            <Link href="/admin/shops/create/general-info">
              <ChevronLeft /> Back
            </Link>
          </AnimatedButton>
          <AnimatedButton onClick={handleSubmit}>
            <Check /> Create Shop
          </AnimatedButton>
        </CardFooter>
      </Card>
    </div>
  )
}
