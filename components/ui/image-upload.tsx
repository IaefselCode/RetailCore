"use client"

import { useRef, useState, type RefObject } from "react"
import { ImagePlus, Loader2, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { uploadImageAction } from "@/lib/image-actions"
import { compressImage, MAX_UPLOAD_BYTES } from "@/lib/images"
import { cn } from "@/lib/utils"

type ImageUploadProps = {
  value?: string | null
  onChange: (url: string | null) => void
  folder?: "products" | "avatars"
  maxDim?: number
  quality?: number
  className?: string
}

export function ImageUpload({
  value,
  onChange,
  folder = "products",
  maxDim = 800,
  quality = 0.72,
  className,
}: ImageUploadProps) {
  const t = useTranslations("imageUpload")
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  async function handleFile(file: File | undefined) {
    if (!file) return
    setError(null)
    setSaved(null)

    if (file.size > MAX_UPLOAD_BYTES) {
      setError(t("tooLarge"))
      return
    }

    setBusy(true)
    try {
      const compressed = await compressImage(file, { maxDim, quality })
      const fd = new FormData()
      fd.append("file", compressed, "image.webp")
      fd.append("folder", folder)

      const result = await uploadImageAction(fd)

      if (result.url) {
        onChange(result.url)
        const percent = Math.max(
          1,
          Math.round((1 - compressed.size / file.size) * 100)
        )
        setSaved(t("saved", { percent: String(percent) }))
      } else {
        setError(result.error ?? t("failed"))
      }
    } catch {
      setError(t("failed"))
    } finally {
      setBusy(false)
    }
  }

  async function handleRemove() {
    if (!value) return
    onChange(null)
    setSaved(null)
  }

  return (
    <div className={cn("space-y-2", className)}>
      {value ? (
        <div className="flex items-center gap-3">
          <div className="relative size-24 overflow-hidden rounded-lg border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="size-full object-cover" />            <button
              type="button"
              onClick={handleRemove}
              className="absolute right-1 top-1 rounded-full bg-background/90 p-1 text-muted-foreground shadow hover:text-destructive"
              aria-label={t("remove")}
            >
              <X className="size-3.5" />
            </button>
          </div>
          <div className="space-y-1">
            <ButtonFile
              ref={inputRef}
              busy={busy}
              label={t("replace")}
              onPick={handleFile}
            />
            {saved && (
              <p className="text-xs text-muted-foreground">{saved}</p>
            )}
          </div>
        </div>
      ) : (
        <ButtonFile
          ref={inputRef}
          busy={busy}
          label={t("upload")}
          onPick={handleFile}
        />
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

type ButtonFileProps = {
  ref: RefObject<HTMLInputElement | null>
  busy: boolean
  label: string
  onPick: (file: File | undefined) => void
}

function ButtonFile({ ref, busy, label, onPick }: ButtonFileProps) {
  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={() => ref.current?.click()}
        className="inline-flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <ImagePlus className="size-4" />
        )}
        {label}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          onPick(e.target.files?.[0])
          e.target.value = ""
        }}
      />
    </>
  )
}
