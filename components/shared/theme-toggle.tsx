"use client"

import { useTheme } from "next-themes"

import { buttonVariants } from "@/components/ui/animate-button"
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

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
