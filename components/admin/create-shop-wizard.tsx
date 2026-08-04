"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "motion/react"
import { ChevronLeft, ChevronRight, Home, Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AnimateButton } from "@/components/ui/animate-button"
import { createShop } from "@/lib/organization-actions"

const steps = ["General Info", "Contact & Location"]

const stepVariants = {
  enter: { opacity: 0, x: 20 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
}

export function CreateShopWizard() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
  })

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const canNext = form.name.trim().length >= 2

  function submit() {
    const fd = new FormData()
    fd.append("name", form.name)
    fd.append("address", form.address)
    fd.append("city", form.city)
    fd.append("state", form.state)
    fd.append("zipCode", form.zipCode)
    fd.append("phone", form.phone)

    startTransition(async () => {
      const result = await createShop(fd)
      if (result.success) {
        toast.success(result.message)
        router.push("/admin/shops")
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Home className="size-3.5" />
        <Link href="/admin" className="hover:text-foreground">Dashboard</Link>
        <ChevronRight className="size-3.5" />
        <Link href="/admin/shops" className="hover:text-foreground">Shops</Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">Create Shop</span>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Create New Shop</CardTitle>
              <CardDescription>
                Step {step + 1} of {steps.length}: {steps[step]}
              </CardDescription>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
              {step + 1}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            {steps.map((label, i) => (
              <div
                key={label}
                className={`h-1 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent>
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="step0"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="name">Shop Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter shop name"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="Street address"
                    value={form.address}
                    onChange={(e) => update("address", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="City"
                      value={form.city}
                      onChange={(e) => update("city", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State / Region</Label>
                    <Input
                      id="state"
                      placeholder="State or region"
                      value={form.state}
                      onChange={(e) => update("state", e.target.value)}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step1"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">Zip / Postal Code</Label>
                    <Input
                      id="zipCode"
                      placeholder="Postal code"
                      value={form.zipCode}
                      onChange={(e) => update("zipCode", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      placeholder="+255 ..."
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                    />
                  </div>
                </div>
                <div className="rounded-lg border bg-muted/40 p-4 text-sm">
                  <p className="font-medium">{form.name || "—"}</p>
                  <p className="text-muted-foreground">
                    {[form.address, form.city, form.state, form.zipCode].filter(Boolean).join(", ") || "No address"}
                  </p>
                  {form.phone && <p className="text-muted-foreground">{form.phone}</p>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>

        <CardFooter className="justify-between">
          {step === 0 ? (
            <AnimateButton variant="outline" asChild>
              <Link href="/admin/shops">Cancel</Link>
            </AnimateButton>
          ) : (
            <AnimateButton variant="outline" onClick={() => setStep((s) => s - 1)} disabled={pending}>
              <ChevronLeft className="size-4" />
              Back
            </AnimateButton>
          )}

          {step < steps.length - 1 ? (
            <AnimateButton onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
              Next
              <ChevronRight className="size-4" />
            </AnimateButton>
          ) : (
            <AnimateButton variant="accent" onClick={submit} disabled={pending || !canNext}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Create Shop
            </AnimateButton>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
