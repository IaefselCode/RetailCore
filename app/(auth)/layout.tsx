"use client"

import { motion } from "motion/react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        {children}
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="text-xs text-muted-foreground"
      >
        &copy; {new Date().getFullYear()} RetailCore. All rights reserved.
      </motion.p>
    </div>
  )
}
