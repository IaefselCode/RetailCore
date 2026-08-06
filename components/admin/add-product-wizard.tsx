"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { motion, AnimatePresence } from "motion/react"
import { ChevronLeft, ChevronRight, Save, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ImageUpload } from "@/components/ui/image-upload"
import { AnimateButton } from "@/components/ui/animate-button"
import { createProduct } from "@/lib/products-actions"

interface Category {
  id: string
  name: string
}

const stepVariants = {
  enter: { opacity: 0, x: 20 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
}

export function AddProductWizard({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const t = useTranslations("addProduct")
  const steps = [t("step1"), t("step2"), t("step3")]
  const [step, setStep] = useState(0)
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState({
    name: "",
    description: "",
    categoryId: "",
    newCategory: "",
    price: "",
    cost: "",
    sku: "",
    imageUrl: "" as string | null,
  })

  const update = (field: string, value: string | null) =>
    setForm((prev) => ({ ...prev, [field]: value ?? "" }))

  const nextStep = () => setStep((s) => Math.min(s + 1, steps.length - 1))
  const prevStep = () => setStep((s) => Math.max(s - 1, 0))

  const canNext0 = form.name.trim().length >= 2
  const canNext1 = form.sku.trim().length >= 2 && form.price.trim() !== ""

  function handleSave() {
    const fd = new FormData()
    fd.append("name", form.name)
    fd.append("description", form.description)
    fd.append("categoryId", form.categoryId)
    fd.append("newCategory", form.newCategory)
    fd.append("price", form.price)
    fd.append("cost", form.cost)
    fd.append("sku", form.sku)
    fd.append("imageUrl", form.imageUrl ?? "")

    startTransition(async () => {
      const result = await createProduct(fd)
      if (result.success) {
        toast.success(result.message)
        router.push("/admin/products")
      } else {
        toast.error(result.message)
      }
    })
  }

  const progress = ((step + 1) / steps.length) * 100

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-1">
        {steps.map((s, i) => (
          <Badge key={s} variant={i === step ? "default" : "outline"} className="cursor-default">
            {s}
          </Badge>
        ))}
      </div>

      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

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
                    <Label htmlFor="name">{t("productName")} <span className="text-destructive">*</span></Label>
                    <Input
                      id="name"
                      placeholder={t("namePlaceholder")}
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">{t("description")}</Label>
                    <Textarea
                      id="description"
                      placeholder={t("descriptionPlaceholder")}
                      rows={4}
                      value={form.description}
                      onChange={(e) => update("description", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("category")}</Label>
                    <Select value={form.categoryId} onValueChange={(v) => update("categoryId", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectCategory")} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newCategory">{t("newCategory")}</Label>
                    <Input
                      id="newCategory"
                      placeholder={t("newCategoryPlaceholder")}
                      value={form.newCategory}
                      onChange={(e) => update("newCategory", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("newCategoryHint")}
                    </p>
                  </div>
                </>
              )}

              {step === 1 && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">{t("sellingPrice")} <span className="text-destructive">*</span></Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={form.price}
                        onChange={(e) => update("price", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cost">{t("costPrice")}</Label>
                      <Input
                        id="cost"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={form.cost}
                        onChange={(e) => update("cost", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sku">{t("sku")} <span className="text-destructive">*</span></Label>
                    <Input
                      id="sku"
                      placeholder={t("skuPlaceholder")}
                      value={form.sku}
                      onChange={(e) => update("sku", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">{t("skuHint")}</p>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="space-y-2">
                    <Label>{t("productImage")}</Label>
                    <ImageUpload
                      value={form.imageUrl}
                      onChange={(url) => update("imageUrl", url)}
                      folder="products"
                      maxDim={800}
                      quality={0.72}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("imageHint")}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4 space-y-2 bg-muted/30">
                    <p className="text-sm font-medium">{t("review")}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-muted-foreground">{t("name")}:</span>
                      <span>{form.name || "—"}</span>
                      <span className="text-muted-foreground">SKU:</span>
                      <span>{form.sku || "—"}</span>
                      <span className="text-muted-foreground">{t("price")}:</span>
                      <span>{form.price ? `${form.price}` : "—"}</span>
                      <span className="text-muted-foreground">{t("cost")}:</span>
                      <span>{form.cost || "—"}</span>
                    </div>
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
          {t("previous")}
        </AnimateButton>
        {step < steps.length - 1 ? (
          <AnimateButton
            onClick={nextStep}
            disabled={step === 0 ? !canNext0 : step === 1 ? !canNext1 : false}
          >
            {t("next")}
            <ChevronRight className="size-4" />
          </AnimateButton>
        ) : (
          <AnimateButton variant="accent" onClick={handleSave} disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {t("saveProduct")}
          </AnimateButton>
        )}
      </div>
    </div>
  )
}
