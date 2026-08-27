"use client"

import { createContext, useContext } from "react"

type DateFormat = "mdy" | "dmy" | "ymd"

const DateFormatContext = createContext<DateFormat>("mdy")

export function DateFormatProvider({
  dateFormat,
  children,
}: {
  dateFormat: DateFormat
  children: React.ReactNode
}) {
  return (
    <DateFormatContext.Provider value={dateFormat}>
      {children}
    </DateFormatContext.Provider>
  )
}

/** Hook for client components to get the current system date format. */
export function useDateFormat(): DateFormat {
  return useContext(DateFormatContext)
}

/**
 * Client-side date formatting using the system date format setting.
 */
export function useFormattedDate(): (date: Date | string | number | null | undefined) => string {
  const format = useDateFormat()

  return (date: Date | string | number | null | undefined): string => {
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
}
