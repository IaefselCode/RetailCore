"use client"

import { useCallback, useState } from "react"
import Cropper, { type Area } from "react-easy-crop"
import {
  Crop,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Check,
  ArrowLeft,
  Loader2,
} from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type CropDialogProps = {
  open: boolean
  imageUrl: string
  /** Called after user confirms preview — receives the cropped File, ready for compress + upload */
  onCropComplete: (croppedFile: File) => void
  onCancel: () => void
  aspect?: number
  roundCrop?: boolean
  /** Max output dimension (default 800) */
  outputSize?: number
}

/* ── helpers ─────────────────────────────────────────────────────────────── */

function getCroppedBlob(
  imageSrc: string,
  pixelCrop: Area,
  outputWidth: number,
  outputHeight: number,
  quality = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = "anonymous"
    image.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = outputWidth
      canvas.height = outputHeight
      const ctx = canvas.getContext("2d")
      if (!ctx) return reject(new Error("Canvas not supported"))

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        outputWidth,
        outputHeight
      )

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Canvas toBlob failed"))
          resolve(blob)
        },
        "image/webp",
        quality
      )
    }
    image.onerror = () => reject(new Error("Failed to load image"))
    image.src = imageSrc
  })
}

/* ── component ───────────────────────────────────────────────────────────── */

type Phase = "crop" | "preview"

export function CropDialog({
  open,
  imageUrl,
  onCropComplete,
  onCancel,
  aspect = 1,
  roundCrop = true,
  outputSize = 800,
}: CropDialogProps) {
  const t = useTranslations("imageUpload")

  // Crop state
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  // Phase management
  const [phase, setPhase] = useState<Phase>("crop")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [croppedFile, setCroppedFile] = useState<File | null>(null)
  const [generating, setGenerating] = useState(false)

  const onCropCompleteInternal = useCallback(
    (_croppedArea: Area, croppedPixels: Area) => {
      setCroppedAreaPixels(croppedPixels)
    },
    []
  )

  /** Phase 1 → Phase 2: generate the cropped blob and show preview */
  const handleNext = useCallback(async () => {
    if (!croppedAreaPixels) return
    setGenerating(true)
    try {
      const outputHeight = Math.round(outputSize / aspect)
      const blob = await getCroppedBlob(
        imageUrl,
        croppedAreaPixels,
        outputSize,
        outputHeight,
        0.85
      )
      const url = URL.createObjectURL(blob)
      const file = new File([blob], "cropped.webp", {
        type: "image/webp",
        lastModified: Date.now(),
      })
      setPreviewUrl(url)
      setCroppedFile(file)
      setPhase("preview")
    } catch {
      // stay on crop phase
    } finally {
      setGenerating(false)
    }
  }, [croppedAreaPixels, imageUrl, aspect, outputSize])

  /** Phase 2 → done: pass the cropped file back */
  function handleConfirm() {
    if (croppedFile) {
      // Clean up preview URL
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      onCropComplete(croppedFile)
    }
  }

  /** Phase 2 → Phase 1: go back to re-crop */
  function handleRetry() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setCroppedFile(null)
    setPhase("crop")
  }

  function handleClose() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setCroppedFile(null)
    setPhase("crop")
    onCancel()
  }

  const isBusy = generating

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crop className="size-5" />
            {phase === "crop" ? t("cropImage") : t("previewCrop")}
          </DialogTitle>
        </DialogHeader>

        {/* ── Phase: Crop ──────────────────────────────────────────── */}
        {phase === "crop" && (
          <>
            <div className="relative h-72 w-full overflow-hidden rounded-lg bg-muted sm:h-80">
              <Cropper
                image={imageUrl}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={aspect}
                cropShape={roundCrop ? "round" : "rect"}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropCompleteInternal}
              />
            </div>

            {/* Zoom */}
            <div className="flex items-center gap-3 px-1">
              <ZoomOut className="size-4 shrink-0 text-muted-foreground" />
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-primary"
              />
              <ZoomIn className="size-4 shrink-0 text-muted-foreground" />
            </div>

            {/* Rotation */}
            <div className="flex items-center gap-3 px-1">
              <RotateCcw className="size-4 shrink-0 text-muted-foreground" />
              <input
                type="range"
                min={0}
                max={360}
                step={1}
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-primary"
              />
              <span className="w-10 text-right text-xs text-muted-foreground">
                {rotation}°
              </span>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={isBusy}>
                {t("cancel")}
              </Button>
              <Button
                onClick={handleNext}
                disabled={isBusy || !croppedAreaPixels}
              >
                {isBusy ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {t("processing")}
                  </>
                ) : (
                  t("previewCrop")
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ── Phase: Preview ───────────────────────────────────────── */}
        {phase === "preview" && previewUrl && (
          <>
            <div className="flex flex-col items-center gap-4 py-4">
              {/* Circle preview */}
              <div className="relative">
                <div className="size-40 overflow-hidden rounded-full border-4 border-primary/20 bg-muted shadow-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt={t("previewCrop")}
                    className="size-full object-cover"
                  />
                </div>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                {t("previewHint")}
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleRetry}
                disabled={isBusy}
              >
                <ArrowLeft className="size-4" />
                {t("reCrop")}
              </Button>
              <Button onClick={handleConfirm} disabled={isBusy}>
                <Check className="size-4" />
                {t("useThisPhoto")}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
