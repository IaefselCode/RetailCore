export type MoneyLike = string | number | null | undefined | { toString(): string }

export function toNumber(value: MoneyLike): number {
  if (value == null || value === "") return 0
  const n = Number(typeof value === "object" ? value.toString() : value)
  return Number.isFinite(n) ? n : 0
}

export function formatMoney(value: MoneyLike): string {
  const n = toNumber(value)
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function formatCompactMoney(value: MoneyLike): string {
  const n = toNumber(value)
  if (Math.abs(n) >= 1000) {
    return `$${(n / 1000).toFixed(1)}k`
  }
  return formatMoney(n)
}

export function toDecimalString(value: MoneyLike): string {
  return toNumber(value).toFixed(2)
}
