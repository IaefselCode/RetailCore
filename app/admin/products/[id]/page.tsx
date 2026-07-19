"use client"

import { motion } from "motion/react"
import { use } from "react"
import Link from "next/link"
import { ArrowLeft, Edit, Trash2, Package } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { AnimateButton } from "@/components/ui/animate-button"

const sectionVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
}

const productData: Record<string, {
  name: string
  sku: string
  category: string
  price: number
  cost: number
  stock: number
  status: string
  description: string
  brand: string
}> = {
  "1": {
    name: "SonicFlow X1 Headphones",
    sku: "SF-X1-001",
    category: "Electronics",
    price: 299.99,
    cost: 180.00,
    stock: 45,
    status: "Active",
    description: "Premium wireless noise-cancelling headphones with 40-hour battery life, adaptive sound control, and ultra-comfortable ear cushions. Features Bluetooth 5.3, multipoint connection, and Hi-Res audio support.",
    brand: "SonicFlow",
  },
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const product = productData[id]

  if (!product) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">Product not found.</p>
        <Link href="/admin/products">
          <AnimateButton variant="outline">
            <ArrowLeft className="size-4" />
            Back to Products
          </AnimateButton>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted-foreground">
        Home <span className="mx-1">/</span>
        <Link href="/admin/products" className="hover:text-foreground">Products</Link>
        <span className="mx-1">/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/products">
            <AnimateButton variant="ghost" size="icon">
              <ArrowLeft className="size-4" />
            </AnimateButton>
          </Link>
          <div className="flex size-16 items-center justify-center rounded-xl bg-muted">
            <Package className="size-8 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{product.name}</h1>
            <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <AnimateButton variant="outline">
            <Edit className="size-4" />
            Edit Product
          </AnimateButton>
          <AnimateButton variant="destructive">
            <Trash2 className="size-4" />
            Delete Product
          </AnimateButton>
        </div>
      </div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
        }}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={sectionVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price</span>
                <span className="font-semibold">${product.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cost</span>
                <span>${product.cost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Margin</span>
                <span className="text-green-600">{((product.price - product.cost) / product.price * 100).toFixed(1)}%</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={sectionVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Stock</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Available</span>
                <span className="font-semibold">{product.stock} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={product.status === "Active" ? "default" : "secondary"}>{product.status}</Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={sectionVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <Badge variant="outline">{product.category}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Brand</span>
                <span>{product.brand}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{product.description}</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
