"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Check, Copy, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createEmployee, updateEmployee } from "@/lib/organization-actions"

export interface EmployeeRow {
  id: string
  userId: string
  firstName: string
  lastName: string
  email: string
  position: string | null
  shopId: string
  shopName: string
  hireDate: string | null
  salary: number
  isActive: boolean
}

export interface ShopOption {
  id: string
  name: string
}

export function EmployeeFormDialog({
  employee,
  shops,
  open,
  onOpenChange,
}: {
  employee?: EmployeeRow | null
  shops: ShopOption[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useTranslations("employees")
  const tc = useTranslations("common")
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [isActive, setIsActive] = useState(employee?.isActive ?? true)
  const [shopId, setShopId] = useState(employee?.shopId ?? "")
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [newName, setNewName] = useState("")
  const [copied, setCopied] = useState(false)

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name = [fd.get("firstName"), fd.get("lastName")].filter(Boolean).join(" ")

    startTransition(async () => {
      const result = employee
        ? await updateEmployee(fd)
        : await createEmployee(fd)

      if (!result.success) {
        toast.error(result.message)
        return
      }

      if (!employee && "temporaryPassword" in result && typeof result.temporaryPassword === "string") {
        setTempPassword(result.temporaryPassword)
        setNewName(name)
      } else {
        toast.success(result.message)
        router.refresh()
        onOpenChange(false)
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

  function closeAfterCreate() {
    setTempPassword(null)
    router.refresh()
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !tempPassword) onOpenChange(false)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{employee ? t("editTitle") : t("createTitle")}</DialogTitle>
          <DialogDescription>
            {employee ? t("editSubtitle") : t("createSubtitle")}
          </DialogDescription>
        </DialogHeader>

        {tempPassword ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
              <p className="text-sm font-medium">{t("tempPasswordTitle")}</p>
              <p className="text-sm text-muted-foreground">
                {t("tempPasswordText", { name: newName || "the employee" })}
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-md border bg-background px-3 py-2 text-sm font-mono">
                  {tempPassword}
                </code>
                <AnimateButton type="button" size="sm" variant="outline" onClick={copyPassword}>
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  {copied ? t("copied") : t("copy")}
                </AnimateButton>
              </div>
            </div>
            <div className="flex justify-end">
              <AnimateButton variant="accent" onClick={closeAfterCreate}>
                {tc("done")}
              </AnimateButton>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {employee && <input type="hidden" name="id" value={employee.id} />}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="emp-first">{t("firstName")}</Label>
                <Input
                  id="emp-first"
                  name="firstName"
                  defaultValue={employee?.firstName ?? ""}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emp-last">{t("lastName")}</Label>
                <Input
                  id="emp-last"
                  name="lastName"
                  defaultValue={employee?.lastName ?? ""}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-email">{t("email")}</Label>
              <Input
                id="emp-email"
                name="email"
                type="email"
                defaultValue={employee?.email ?? ""}
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="emp-position">{t("position")}</Label>
                <Input
                  id="emp-position"
                  name="position"
                  defaultValue={employee?.position ?? ""}
                  placeholder="Cashier"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emp-salary">{t("salary")}</Label>
                <Input
                  id="emp-salary"
                  name="salary"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={employee ? String(employee.salary) : ""}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("shopAssignment")}</Label>
              <Select value={shopId} onValueChange={setShopId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectShop")} />
                </SelectTrigger>
                <SelectContent>
                  {shops.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="shopId" value={shopId} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-hire">{t("hireDate")}</Label>
              <Input
                id="emp-hire"
                name="hireDate"
                type="date"
                defaultValue={employee?.hireDate?.slice(0, 10) ?? ""}
              />
            </div>
            {employee && (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor="emp-active">{t("activeLabel")}</Label>
                <Switch id="emp-active" checked={isActive} onCheckedChange={setIsActive} />
                <input type="hidden" name="isActive" value={isActive ? "on" : "off"} />
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <AnimateButton type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                {tc("cancel")}
              </AnimateButton>
              <AnimateButton type="submit" variant="accent" disabled={pending}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                {tc("save")}
              </AnimateButton>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
