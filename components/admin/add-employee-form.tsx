"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
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
  const t = useTranslations("addEmployee")
  const te = useTranslations("employees")
  const tc = useTranslations("common")
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
          <CardTitle>{t("employeeCreated")}</CardTitle>
          <CardDescription>
            {te("tempPasswordText", { name: employeeName })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{te("loginHint")}</p>
            <p className="font-medium">{employeeEmail}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">{te("tempPasswordTitle")}</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-md border bg-muted px-3 py-2 text-sm font-mono">
                {tempPassword}
              </code>
              <AnimateButton type="button" size="sm" variant="outline" onClick={copyPassword}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? te("copied") : te("copy")}
              </AnimateButton>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <AnimateButton variant="accent" onClick={() => router.push("/admin/employees")}>
            {tc("done")}
          </AnimateButton>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("employeeDetails")}</CardTitle>
        <CardDescription>{t("employeeDetailsDesc")}</CardDescription>
      </CardHeader>
      <form onSubmit={submit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">{te("firstName")}</Label>
              <Input id="firstName" name="firstName" placeholder={t("firstPlaceholder")} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">{te("lastName")}</Label>
              <Input id="lastName" name="lastName" placeholder={t("lastPlaceholder")} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{te("email")}</Label>
            <Input id="email" name="email" type="email" placeholder={t("emailPlaceholder")} required />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="position">{te("position")}</Label>
              <Input id="position" name="position" placeholder={t("positionPlaceholder")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary">{te("salary")}</Label>
              <Input id="salary" name="salary" type="number" min="0" step="1" placeholder={t("salaryPlaceholder")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{te("shopAssignment")}</Label>
            <Select value={shopId} onValueChange={setShopId}>
              <SelectTrigger>
                <SelectValue placeholder={te("selectShop")} />
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
            <Label htmlFor="hireDate">{te("hireDate")}</Label>
            <Input id="hireDate" name="hireDate" type="date" />
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <AnimateButton type="button" variant="outline" onClick={() => router.push("/admin/employees")}>
            {tc("cancel")}
          </AnimateButton>
          <AnimateButton type="submit" variant="accent" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            {t("createEmployee")}
          </AnimateButton>
        </CardFooter>
      </form>
    </Card>
  )
}
