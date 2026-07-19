"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, Trash2, Save, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import { AnimateButton } from "@/components/ui/animate-button"

const suppliers = ["TechDistributors Inc.", "GlobalSupply Co.", "PrimeElectronics Ltd.", "DirectSource LLC"]
const availableProducts = [
  "SonicFlow X1 Headphones",
  "QuantumCharge Pro Power Bank",
  "AeroGlide Wireless Mouse",
  "PixelMax 4K Monitor",
  "SwiftBook Pro Laptop",
]

export default function PurchaseStockPage() {
  const router = useRouter()
  const [supplier, setSupplier] = useState("")
  const [expectedDate, setExpectedDate] = useState("")
  const [lineItems, setLineItems] = useState<{ product: string; quantity: string; unitCost: string }[]>([])
  const [newProduct, setNewProduct] = useState("")
  const [newQty, setNewQty] = useState("")
  const [newCost, setNewCost] = useState("")

  const addLineItem = () => {
    if (!newProduct || !newQty || !newCost) return
    setLineItems([...lineItems, { product: newProduct, quantity: newQty, unitCost: newCost }])
    setNewProduct("")
    setNewQty("")
    setNewCost("")
  }

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index))
  }

  const totalCost = lineItems.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unitCost) || 0), 0)

  const handleSubmit = (status: "draft" | "submitted") => {
    if (!supplier) {
      toast.error("Please select a supplier")
      return
    }
    if (lineItems.length === 0) {
      toast.error("Please add at least one product")
      return
    }
    toast.success(status === "draft" ? "Purchase order saved as draft" : "Purchase order submitted successfully")
    router.push("/admin/inventory")
  }

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted-foreground">
        Dashboard <span className="mx-1">/</span>
        <Link href="/admin/inventory" className="hover:text-foreground">Inventory</Link>
        <span className="mx-1">/</span>
        <span className="text-foreground">Purchase Stock</span>
      </nav>

      <h1 className="text-2xl font-semibold">Create Purchase Order</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="supplier">Supplier</Label>
          <Select value={supplier} onValueChange={(v) => v && setSupplier(v)}>
            <SelectTrigger id="supplier">
              <SelectValue placeholder="Select supplier" />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="expectedDate">Expected Delivery Date</Label>
          <Input id="expectedDate" type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="product">Product</Label>
              <Select value={newProduct} onValueChange={(v) => v && setNewProduct(v)}>
                <SelectTrigger id="product">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {availableProducts.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-24 space-y-2">
              <Label htmlFor="qty">Quantity</Label>
              <Input id="qty" type="number" placeholder="0" value={newQty} onChange={(e) => setNewQty(e.target.value)} />
            </div>
            <div className="w-28 space-y-2">
              <Label htmlFor="unitCost">Unit Cost</Label>
              <Input id="unitCost" type="number" step="0.01" placeholder="0.00" value={newCost} onChange={(e) => setNewCost(e.target.value)} />
            </div>
            <Button className="mt-2" onClick={addLineItem}>
              <Plus className="size-4" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Unit Cost</TableHead>
              <TableHead>Subtotal</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lineItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No items added yet
                </TableCell>
              </TableRow>
            ) : (
              lineItems.map((item, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{item.product}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>${parseFloat(item.unitCost).toFixed(2)}</TableCell>
                  <TableCell>${((parseFloat(item.quantity) || 0) * (parseFloat(item.unitCost) || 0)).toFixed(2)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon-sm" onClick={() => removeLineItem(i)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-lg">
          Total: <span className="font-bold">${totalCost.toFixed(2)}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <AnimateButton variant="outline" onClick={() => handleSubmit("draft")}>
            <Save className="size-4" />
            Save as Draft
          </AnimateButton>
          <AnimateButton variant="accent" onClick={() => handleSubmit("submitted")}>
            <Send className="size-4" />
            Submit Purchase Order
          </AnimateButton>
        </div>
      </div>
    </div>
  )
}
