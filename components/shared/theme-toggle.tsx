"use client"

import { useTheme } from "next-themes"

import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <AnimatedThemeToggler
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      onThemeChange={setTheme}
      className="flex size-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
    />
  )
}
