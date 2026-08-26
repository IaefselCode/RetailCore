"use client"

import { createContext, useContext } from "react"

const CurrencyContext = createContext<string>("USD")

export function CurrencyProvider({
  currency,
  children,
}: {
  currency: string
  children: React.ReactNode
}) {
  return (
    <CurrencyContext.Provider value={currency}>
      {children}
    </CurrencyContext.Provider>
  )
}

/** Hook for client components to get the current system currency code (e.g. "USD", "TZS"). */
export function useCurrency(): string {
  return useContext(CurrencyContext)
}
