"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Save } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress, ProgressIndicator, ProgressTrack, ProgressValue } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { AnimateButton } from "@/components/ui/animate-button"

const steps = ["General Info", "Pricing & Stock", "Media & Status"]

const stepVariants = {
  enter: { opacity: 0, x: 20 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
}

export default function AddProductPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    brand: "",
    price: "",
    cost: "",
    sku: "",
    stock: "",
    imageUrl: "",
    status: "active",
  })

  const update = (field: string, value: string | null) => setForm((prev) => ({ ...prev, [field]: value ?? "" }))

  const nextStep = () => setStep((s) => Math.min(s + 1, steps.length - 1))
  const prevStep = () => setStep((s) => Math.max(s - 1, 0))

  const handleSave = () => {
    toast.success("Product created successfully!")
    router.push("/admin/products")
  }

  const progress = ((step + 1) / steps.length) * 100

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted-foreground">
        Dashboard <span className="mx-1">/</span>
        <Link href="/admin/products" className="hover:text-foreground">Products</Link>
        <span className="mx-1">/</span>
        <span className="text-foreground">Add Product</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-semibold">Add Product</h1>
        <div className="flex flex-wrap gap-1">
          {steps.map((s, i) => (
            <Badge key={s} variant={i === step ? "default" : "outline"} className="cursor-default">
              {s}
            </Badge>
          ))}
        </div>
      </div>

      <Progress value={progress}>
        <ProgressTrack>
          <ProgressIndicator />
        </ProgressTrack>
        <ProgressValue>{() => `${Math.round(progress)}%`}</ProgressValue>
      </Progress>

      <Card>
        <CardHeader>
          <CardTitle>{steps[step]}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              {step === 0 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name</Label>
                    <Input id="name" placeholder="Enter product name" value={form.name} onChange={(e) => update("name", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" placeholder="Enter product description" rows={4} value={form.description} onChange={(e) => update("description", e.target.value)} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select value={form.category} onValueChange={(v) => update("category", v)}>
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Electronics">Electronics</SelectItem>
                          <SelectItem value="Accessories">Accessories</SelectItem>
                          <SelectItem value="Smart Home">Smart Home</SelectItem>
                          <SelectItem value="Green Tech">Green Tech</SelectItem>
                          <SelectItem value="Home">Home</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="brand">Brand</Label>
                      <Input id="brand" placeholder="Enter brand name" value={form.brand} onChange={(e) => update("brand", e.target.value)} />
                    </div>
                  </div>
                </>
              )}

              {step === 1 && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price ($)</Label>
                      <Input id="price" type="number" step="0.01" placeholder="0.00" value={form.price} onChange={(e) => update("price", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cost">Cost ($)</Label>
                      <Input id="cost" type="number" step="0.01" placeholder="0.00" value={form.cost} onChange={(e) => update("cost", e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sku">SKU</Label>
                      <Input id="sku" placeholder="e.g. PRD-001" value={form.sku} onChange={(e) => update("sku", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stock">Initial Stock Quantity</Label>
                      <Input id="stock" type="number" placeholder="0" value={form.stock} onChange={(e) => update("stock", e.target.value)} />
                    </div>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="imageUrl">Image URL</Label>
                    <Input id="imageUrl" placeholder="https://example.com/image.jpg" value={form.imageUrl} onChange={(e) => update("imageUrl", e.target.value)} />
                  </div>
                  <div className="flex items-center gap-4">
                    <Label htmlFor="status">Active</Label>
                    <Switch id="status" checked={form.status === "active"} onCheckedChange={(v) => update("status", v ? "active" : "draft")} />
                    <Badge variant={form.status === "active" ? "default" : "secondary"}>{form.status === "active" ? "Active" : "Draft"}</Badge>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <AnimateButton variant="outline" onClick={prevStep} disabled={step === 0}>
          <ChevronLeft className="size-4" />
          Previous
        </AnimateButton>
        {step < steps.length - 1 ? (
          <AnimateButton onClick={nextStep}>
            Next
            <ChevronRight className="size-4" />
          </AnimateButton>
        ) : (
          <AnimateButton variant="accent" onClick={handleSave}>
            <Save className="size-4" />
            Save Product
          </AnimateButton>
        )}
      </div>
    </div>
  )
}
