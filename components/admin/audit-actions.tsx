"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Download, Trash2, AlertTriangle, Trash, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { deleteAuthLog, clearAuthLogs, exportAuthLogsCsv } from "@/lib/audit-actions"

/** Toolbar with Export and Clear-All actions for the audit log page. */
export function AuditToolbar() {
  const t = useTranslations("audit")
  const tc = useTranslations("common")
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirmClear, setConfirmClear] = useState(false)

  function exportCsv() {
    startTransition(async () => {
      const csv = await exportAuthLogsCsv()
      if (!csv) {
        toast.error(t("exportFailed"))
        return
      }
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(t("exported"))
    })
  }

  function clearAll() {
    startTransition(async () => {
      const result = await clearAuthLogs()
      setConfirmClear(false)
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <AnimateButton variant="outline" size="sm" disabled={pending} onClick={exportCsv}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          {t("export")}
        </AnimateButton>
        <AnimateButton
          variant="ghost"
          size="sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          disabled={pending}
          onClick={() => setConfirmClear(true)}
        >
          <Trash className="size-4" />
          {t("clearAll")}
        </AnimateButton>
      </div>

      <AlertDialog open={confirmClear} onOpenChange={(open) => !open && setConfirmClear(false)}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia>
              <AlertTriangle className="size-8 text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>{t("clearAllTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("clearAllDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmClear(false)}>{tc("cancel")}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={pending} onClick={clearAll}>
              {t("clearAllConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

/** Per-row delete button for a single audit log entry. */
export function DeleteLogButton({ id }: { id: string }) {
  const t = useTranslations("audit")
  const tc = useTranslations("common")
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirm, setConfirm] = useState(false)

  function doDelete() {
    const fd = new FormData()
    fd.append("id", id)
    startTransition(async () => {
      const result = await deleteAuthLog(fd)
      setConfirm(false)
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <>
      <AnimateButton
        size="icon-sm"
        variant="ghost"
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setConfirm(true)}
        disabled={pending}
        aria-label={t("delete")}
      >
        <Trash2 className="size-4" />
      </AnimateButton>

      <AlertDialog open={confirm} onOpenChange={(open) => !open && setConfirm(false)}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia>
              <AlertTriangle className="size-8 text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirm(false)}>{tc("cancel")}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={pending} onClick={doDelete}>
              {t("deleteConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
