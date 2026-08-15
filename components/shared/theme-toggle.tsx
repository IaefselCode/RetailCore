"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

import { buttonVariants } from "@/components/ui/animate-button"
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // resolvedTheme is undefined during SSR and only resolves (from
  // localStorage / system preference) on the client. Rendering it before
  // mount would make the server HTML (light) mismatch the client (dark),
  // so hold the light render until hydration finishes.
  const isDark = mounted && resolvedTheme === "dark"

  return (
    <AnimatedThemeToggler
      theme={isDark ? "dark" : "light"}
      onThemeChange={(next) => setTheme(next)}
      variant="circle"
      aria-label="Toggle theme"
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon-sm" }),
        "shrink-0 [&_svg]:size-4"
      )}
    />
  )
}
