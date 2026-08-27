import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { requireEmployeeContext } from "@/lib/auth-utils"
import { getTranslations } from "next-intl/server"
import { RecordSaleForm } from "@/components/employee/record-sale-form"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
} from "@/components/ui/table"
import {
  ListSkeleton,
  SearchBarSkeleton,
  TableRowsSkeleton,
} from "@/components/shared/skeleton-primitives"

export const metadata = { title: "Record Sale | RetailCore" }

export default async function RecordSalePage() {
  const ctx = await requireEmployeeContext()
  const t = await getTranslations("recordSale")

  return (
    <Suspense fallback={<PosSkeleton t={t} />}>
      <RecordSaleContent shopId={ctx.shopId} shopName={ctx.shopName} />
    </Suspense>
  )
}

async function RecordSaleContent({ shopId, shopName }: { shopId: string; shopName: string }) {
  const products = await prisma.product.findMany({
    where: { isActive: true, inventory: { some: { shopId } } },
    orderBy: { name: "asc" },
    include: {
      inventory: { where: { shopId }, select: { quantity: true } },
    },
  })

  const posProducts = products
    .map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      stock: p.inventory[0]?.quantity ?? 0,
      isActive: p.isActive,
    }))
    .filter((p) => p.stock > 0)

  return <RecordSaleForm products={posProducts} shopName={shopName} />
}

function PosSkeleton({ t }: { t: (key: string, values?: Record<string, string | number>) => string }) {
  // Mirrors RecordSaleForm's exact arrangement: heading + Find Products card
  // + Sale Items card (left) and Order Summary card (right).
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-4">
          {/* Find Products card */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <SearchBarSkeleton />
              <ListSkeleton rows={5} />
            </CardContent>
          </Card>

          {/* Sale Items card */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("colProduct")}</TableHead>
                      <TableHead>{t("colQty")}</TableHead>
                      <TableHead>{t("colPrice")}</TableHead>
                      <TableHead>{t("colSubtotal")}</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRowsSkeleton rows={3} columns={["w-32", "w-16", "w-16", "w-16", "w-8"]} />
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary card */}
        <Card className="h-fit">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-9 w-full rounded-md" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-7 w-24" />
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Skeleton className="h-9 w-full rounded-md" />
            <Skeleton className="h-11 w-full rounded-md" />
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
