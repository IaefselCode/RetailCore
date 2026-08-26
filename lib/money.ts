import { getSystemSetting } from "@/lib/settings-actions"

export type MoneyLike = string | number | null | undefined | { toString(): string }

const CURRENCY_MAP: Record<string, string> = {
  usd: "USD",
  eur: "EUR",
  gbp: "GBP",
  cad: "CAD",
  tzs: "TZS",
}

/** Get the current system currency as an Intl-compatible code (e.g. "USD", "TZS"). */
export async function getSystemCurrency(): Promise<string> {
  const raw = await getSystemSetting("currency", "usd")
  return CURRENCY_MAP[raw] ?? "USD"
}

export function toNumber(value: MoneyLike): number {
  if (value == null || value === "") return 0
  const n = Number(typeof value === "object" ? value.toString() : value)
  return Number.isFinite(n) ? n : 0
}

export function formatMoney(value: MoneyLike, currency: string = "USD"): string {
  const n = toNumber(value)
  return n.toLocaleString("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function formatCompactMoney(value: MoneyLike, currency: string = "USD"): string {
  const n = toNumber(value)
  if (Math.abs(n) >= 1000) {
    return `${(n / 1000).toFixed(1)}k`
  }
  return formatMoney(n, currency)
}

export function toDecimalString(value: MoneyLike): string {
  return toNumber(value).toFixed(2)
}
