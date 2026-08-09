"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useTranslations } from "next-intl"
import {
  Search,
  Package,
  Store,
  Users,
  Receipt,
  Loader2,
  CornerDownLeft,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { globalSearch, type GlobalSearchResults } from "@/lib/search-actions"
import { cn } from "@/lib/utils"

const GROUP_META = {
  products: { icon: Package, labelKey: "products" },
  shops: { icon: Store, labelKey: "shops" },
  employees: { icon: Users, labelKey: "employees" },
  sales: { icon: Receipt, labelKey: "sales" },
} as const

const DEBOUNCE_MS = 250
const MIN_QUERY_LENGTH = 2

/**
 * General system search rendered in the topbar (admin + employee).
 * Queries the server action `globalSearch` with a debounce and shows
 * grouped results in a dropdown with keyboard navigation.
 */
export function GlobalSearch({ placeholder }: { placeholder?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations("globalSearch")
  const tt = useTranslations("topbar")

  const [query, setQuery] = useState("")
  const [results, setResults] = useState<GlobalSearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const seqRef = useRef(0)

  // Close the dropdown when the route changes (render-time adjustment,
  // recommended over a setState-in-effect for deriving state from props).
  const [lastPathname, setLastPathname] = useState(pathname)
  if (lastPathname !== pathname) {
    setLastPathname(pathname)
    setOpen(false)
  }

  const flatItems = (results?.groups ?? []).flatMap((g) => g.items)
  const showDropdown = open && query.trim().length >= MIN_QUERY_LENGTH

  // Debounced server query. State is only updated inside the async timer
  // callback; stale responses are dropped via a sequence ref.
  useEffect(() => {
    const q = query.trim()
    if (q.length < MIN_QUERY_LENGTH) {
      seqRef.current += 1 // invalidate any in-flight request
      return
    }
    const seq = ++seqRef.current
    const timer = setTimeout(async () => {
      setLoading(true)
      const res = await globalSearch(q)
      if (seqRef.current !== seq) return
      setResults(res)
      setLoading(false)
      setActiveIndex(0)
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query])

  // Click outside closes the dropdown.
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onMouseDown)
    return () => document.removeEventListener("mousedown", onMouseDown)
  }, [])

  function closeDropdown() {
    setOpen(false)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false)
      inputRef.current?.blur()
      return
    }
    if (!open || flatItems.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % flatItems.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => (i - 1 + flatItems.length) % flatItems.length)
    } else if (e.key === "Enter") {
      e.preventDefault()
      const item = flatItems[activeIndex] ?? flatItems[0]
      if (item) {
        setOpen(false)
        router.push(item.href)
      }
    }
  }

  return (
    <div ref={containerRef} className="relative hidden sm:block max-w-xs flex-1">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onKeyDown={onKeyDown}
        onFocus={() => {
          if (query.trim().length >= MIN_QUERY_LENGTH) setOpen(true)
        }}
        placeholder={placeholder ?? t("placeholder")}
        className="pl-8"
        role="combobox"
        aria-expanded={open}
        aria-label={tt("searchPlaceholder")}
        autoComplete="off"
      />

      {showDropdown && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-lg"
        >
          {loading && !results ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {t("searching")}
            </div>
          ) : !results || results.groups.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">{t("noResults")}</p>
          ) : (
            <div className="max-h-[26rem] overflow-y-auto py-1">
              {(() => {
                let flatOffset = 0
                return results.groups.map((group) => {
                  const meta = GROUP_META[group.type]
                  const Icon = meta.icon
                  const groupStart = flatOffset
                  flatOffset += group.items.length
                  return (
                    <div key={group.type} className="px-1.5 py-1">
                      <p className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        <Icon className="size-3.5" />
                        {t(meta.labelKey)}
                      </p>
                      {group.items.map((item, i) => {
                        const flatIndex = groupStart + i
                        const active = flatIndex === activeIndex
                        return (
                          <Link
                            key={item.id}
                            href={item.href}
                            onClick={closeDropdown}
                            onMouseEnter={() => setActiveIndex(flatIndex)}
                            className={cn(
                              "flex items-center gap-3 rounded-md px-2.5 py-2 transition-colors",
                              active && "bg-muted"
                            )}
                          >
                            <Icon className="size-4 shrink-0 text-muted-foreground" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium">{item.title}</span>
                              {item.subtitle && (
                                <span className="block truncate text-xs text-muted-foreground">
                                  {item.subtitle}
                                </span>
                              )}
                            </span>
                            <CornerDownLeft className="size-3.5 shrink-0 text-muted-foreground/60" />
                          </Link>
                        )
                      })}
                      <Link
                        href={group.viewAllHref}
                        onClick={closeDropdown}
                        className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-primary hover:underline"
                      >
                        {t("viewAll")} <span aria-hidden>→</span>
                      </Link>
                    </div>
                  )
                })
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
