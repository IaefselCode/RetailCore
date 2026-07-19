"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRightLeft, Send } from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { AnimateButton } from "@/components/ui/animate-button"

const products = [
  { id: "1", name: "SonicFlow X1 Headphones", sku: "SF-X1-001", totalStock: 45 },
  { id: "2", name: "QuantumCharge Pro Power Bank", sku: "QC-PB-002", totalStock: 120 },
  { id: "3", name: "AeroGlide Wireless Mouse", sku: "AG-WM-004", totalStock: 200 },
]

const shops = [
  { id: "s1", name: "Downtown Store", currentStock: 8 },
  { id: "s2", name: "Mall Branch", currentStock: 5 },
  { id: "s3", name: "Airport Kiosk", currentStock: 2 },
  { id: "s4", name: "Uptown Outlet", currentStock: 0 },
]

export default function StockDistributionPage() {
  const router = useRouter()
  const [selectedProduct, setSelectedProduct] = useState("")
  const [distributions, setDistributions] = useState<Record<string, string>>({})

  const product = products.find((p) => p.id === selectedProduct)

  const updateDistribution = (shopId: string, value: string) => {
    setDistributions((prev) => ({ ...prev, [shopId]: value }))
  }

  const totalDistributed = Object.values(distributions).reduce((sum, v) => sum + (parseInt(v) || 0), 0)

  const handleSubmit = () => {
    if (!selectedProduct) {
      toast.error("Please select a product")
      return
    }
    if (totalDistributed === 0) {
      toast.error("Please distribute at least one unit")
      return
    }
    toast.success("Stock distributed successfully!")
    router.push("/admin/inventory")
  }

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted-foreground">
        Home <span className="mx-1">/</span>
        <Link href="/admin/inventory" className="hover:text-foreground">Inventory</Link>
        <span className="mx-1">/</span>
        <span className="text-foreground">Stock Distribution</span>
      </nav>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Distribute Stock to Shops</h1>
        <ArrowRightLeft className="size-5 text-muted-foreground" />
      </div>

      <div className="w-full sm:w-80 space-y-2">
        <Label htmlFor="product">Select Product</Label>
        <Select value={selectedProduct} onValueChange={(v) => v && setSelectedProduct(v)}>
          <SelectTrigger id="product">
            <SelectValue placeholder="Choose a product" />
          </SelectTrigger>
          <SelectContent>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {product && (
        <Card>
          <CardHeader>
            <CardTitle>Distribution for {product.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Available Stock: <span className="font-semibold text-foreground">{product.totalStock} units</span>
            </p>
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shop</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Distribution Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shops.map((shop) => (
                  <TableRow key={shop.id}>
                    <TableCell className="font-medium">{shop.name}</TableCell>
                    <TableCell>{shop.currentStock}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        placeholder="0"
                        className="w-24"
                        value={distributions[shop.id] || ""}
                        onChange={(e) => updateDistribution(shop.id, e.target.value)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
        <div>
          <span className="text-sm text-muted-foreground">Total to Distribute</span>
          <p className="text-xl font-bold">{totalDistributed} units</p>
        </div>
        <Dialog>
          <DialogTrigger>
            <AnimateButton variant="accent" disabled={!selectedProduct || totalDistributed === 0}>
              <Send className="size-4" />
              Submit Distribution
            </AnimateButton>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Distribution</DialogTitle>
              <DialogDescription>
                You are about to distribute {totalDistributed} units of {product?.name} to {Object.keys(distributions).filter((k) => parseInt(distributions[k]) > 0).length} shops. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <AnimateButton variant="outline" className="mr-auto">Cancel</AnimateButton>
              <AnimateButton onClick={handleSubmit}>Confirm Distribution</AnimateButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
