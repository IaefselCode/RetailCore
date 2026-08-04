import { prisma } from "@/lib/prisma"
import { requireEmployeeContext } from "@/lib/auth-utils"
import { RecordSaleForm } from "@/components/employee/record-sale-form"

export const metadata = { title: "Record Sale | RetailCore" }

export default async function RecordSalePage() {
  const ctx = await requireEmployeeContext()

  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: {
      inventory: { where: { shopId: ctx.shopId }, select: { quantity: true } },
    },
  })

  const posProducts = products
    .map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      stock: p.inventory[0]?.quantity ?? 0,
    }))
    .filter((p) => p.stock > 0)

  return <RecordSaleForm products={posProducts} shopName={ctx.shopName} />
}
