"use client"

import { useRef, useState, type RefObject } from "react"
import { ImagePlus, Loader2, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { uploadImageAction } from "@/lib/image-actions"
import { compressImage, MAX_UPLOAD_BYTES } from "@/lib/images"
import { cn } from "@/lib/utils"
import { CropDialog } from "@/components/ui/crop-dialog"

type ImageUploadProps = {
  value?: string | null
  onChange: (url: string | null) => void
  folder?: "products" | "avatars" | "profiles"
  maxDim?: number
  quality?: number
  className?: string
  /** Hide the inline square preview — useful when an external Avatar shows the image */
  hidePreview?: boolean
  /** Enable crop dialog before upload (default: true for profiles/avatars) */
  enableCrop?: boolean
  /** Crop area aspect ratio (default: 1 for square/circle) */
  cropAspect?: number
  /** Use round crop overlay in the crop dialog */
  roundCrop?: boolean
}

export function ImageUpload({
  value,
  onChange,
  folder = "products",
  maxDim = 800,
  quality = 0.72,
  className,
  hidePreview = false,
  enableCrop = false,
  cropAspect = 1,
  roundCrop = false,
}: ImageUploadProps) {
  const t = useTranslations("imageUpload")
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  // Crop state
  const [cropOpen, setCropOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [rawFile, setRawFile] = useState<File | null>(null)

  async function handleFile(file: File | undefined) {
    if (!file) return
    setError(null)
    setSaved(null)

    if (file.size > MAX_UPLOAD_BYTES) {
      setError(t("tooLarge"))
      return
    }

    if (enableCrop) {
      // Show crop dialog instead of uploading directly
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setRawFile(file)
      setCropOpen(true)
      return
    }

    await uploadCompressed(file)
  }

  async function uploadCompressed(file: File) {
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

  async function handleCropComplete(croppedFile: File) {
    setCropOpen(false)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setRawFile(null)
    await uploadCompressed(croppedFile)
  }

  function handleCropCancel() {
    setCropOpen(false)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setRawFile(null)
  }

  async function handleRemove() {
    if (!value) return
    onChange(null)
    setSaved(null)
  }

  return (
    <div className={cn("space-y-2", className)}>
      {value && !hidePreview ? (
        <div className="flex items-center gap-3">
          <div className="relative size-24 overflow-hidden rounded-lg border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="size-full object-cover" />
            <button
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
      ) : hidePreview && value ? (
        <div className="flex items-center gap-2">
          <ButtonFile
            ref={inputRef}
            busy={busy}
            label={t("change")}
            onPick={handleFile}
          />
          <button
            type="button"
            onClick={handleRemove}
            className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-destructive/40 px-3 py-2 text-sm text-destructive transition-colors hover:border-destructive hover:bg-destructive/5"
          >
            <X className="size-4" />
            {t("remove")}
          </button>
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

      {previewUrl && (
        <CropDialog
          open={cropOpen}
          imageUrl={previewUrl}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspect={cropAspect}
          roundCrop={roundCrop}
        />
      )}
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
