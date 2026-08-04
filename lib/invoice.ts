import { prisma } from "@/lib/prisma"

export async function nextInvoiceNo(): Promise<string> {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  const prefix = `RC-${y}${m}${d}-`

  const latest = await prisma.sale.findFirst({
    where: { invoiceNo: { startsWith: prefix } },
    orderBy: { invoiceNo: "desc" },
    select: { invoiceNo: true },
  })

  const seq = latest
    ? parseInt(latest.invoiceNo.slice(prefix.length), 10) + 1
    : 1

  return `${prefix}${String(seq).padStart(4, "0")}`
}
