import { prisma } from "@/lib/prisma"
import { requireEmployeeContext } from "@/lib/auth-utils"
import { EmployeeProductCatalog } from "@/components/employee/product-catalog"

export const metadata = { title: "Products | RetailCore" }

export default async function EmployeeProductsPage() {
  const ctx = await requireEmployeeContext()

  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: {
      category: { select: { name: true } },
      inventory: { where: { shopId: ctx.shopId }, select: { quantity: true } },
    },
  })

  const rows = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    price: Number(p.price),
    stock: p.inventory[0]?.quantity ?? 0,
    categoryName: p.category?.name ?? null,
    description: p.description,
  }))

  return <EmployeeProductCatalog products={rows} />
}
