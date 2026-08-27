import { getSystemSetting } from "@/lib/settings-actions"

type DateFormat = "mdy" | "dmy" | "ymd"

/**
 * Format a date according to the system's date format setting.
 * Works in server components (async) and can be pre-fetched for client use.
 */
export async function getDateFormat(): Promise<DateFormat> {
  const raw = await getSystemSetting("dateFormat", "mdy")
  return (raw as DateFormat) || "mdy"
}

/**
 * Format a date using the given format code.
 * Falls back to locale default if format is unrecognized.
 */
export function formatDate(
  date: Date | string | number | null | undefined,
  format: DateFormat = "mdy"
): string {
  if (!date) return "—"
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return "—"

  const day = String(d.getDate()).padStart(2, "0")
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const year = String(d.getFullYear())

  switch (format) {
    case "dmy":
      return `${day}/${month}/${year}`
    case "ymd":
      return `${year}-${month}-${day}`
    case "mdy":
    default:
      return `${month}/${day}/${year}`
  }
}

/**
 * Format a date with long month name (e.g. "January 15, 2024").
 * Used for detail views where a more readable format is preferred.
 */
export function formatDateLong(
  date: Date | string | number | null | undefined,
  locale: string = "en-US"
): string {
  if (!date) return "—"
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}
