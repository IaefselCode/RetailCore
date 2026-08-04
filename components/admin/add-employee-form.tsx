"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, Copy, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createEmployee } from "@/lib/organization-actions"

interface ShopOption {
  id: string
  name: string
}

export function AddEmployeeForm({ shops }: { shops: ShopOption[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [shopId, setShopId] = useState("")
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [employeeName, setEmployeeName] = useState("")
  const [employeeEmail, setEmployeeEmail] = useState("")
  const [copied, setCopied] = useState(false)

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name = [fd.get("firstName"), fd.get("lastName")].filter(Boolean).join(" ")
    const email = String(fd.get("email") ?? "")

    startTransition(async () => {
      const result = await createEmployee(fd)
      if (!result.success) {
        toast.error(result.message)
        return
      }
      if ("temporaryPassword" in result && result.temporaryPassword) {
        setTempPassword(result.temporaryPassword)
        setEmployeeName(name)
        setEmployeeEmail(email)
      } else {
        toast.success(result.message)
        router.push("/admin/employees")
      }
    })
  }

  function copyPassword() {
    if (!tempPassword) return
    navigator.clipboard.writeText(tempPassword).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  if (tempPassword) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Employee Created</CardTitle>
          <CardDescription>
            Share this one-time password with {employeeName}. They can change it after signing in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Login email</p>
            <p className="font-medium">{employeeEmail}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Temporary password</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-md border bg-muted px-3 py-2 text-sm font-mono">
                {tempPassword}
              </code>
              <AnimateButton type="button" size="sm" variant="outline" onClick={copyPassword}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? "Copied" : "Copy"}
              </AnimateButton>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <AnimateButton variant="accent" onClick={() => router.push("/admin/employees")}>
            Done
          </AnimateButton>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Employee Details</CardTitle>
        <CardDescription>Fill in the employee information below</CardDescription>
      </CardHeader>
      <form onSubmit={submit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" name="firstName" placeholder="John" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" name="lastName" placeholder="Doe" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="john@retailcore.dev" required />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input id="position" name="position" placeholder="Cashier" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary">Salary</Label>
              <Input id="salary" name="salary" type="number" min="0" step="1" placeholder="0" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Shop assignment</Label>
            <Select value={shopId} onValueChange={setShopId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a shop" />
              </SelectTrigger>
              <SelectContent>
                {shops.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="shopId" value={shopId} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hireDate">Hire date</Label>
            <Input id="hireDate" name="hireDate" type="date" />
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <AnimateButton type="button" variant="outline" onClick={() => router.push("/admin/employees")}>
            Cancel
          </AnimateButton>
          <AnimateButton type="submit" variant="accent" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            Create Employee
          </AnimateButton>
        </CardFooter>
      </form>
    </Card>
  )
}
