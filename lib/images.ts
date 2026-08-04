export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

export type CompressOptions = {
  maxDim?: number
  quality?: number
}

export async function compressImage(
  file: File,
  { maxDim = 800, quality = 0.72 }: CompressOptions = {}
): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  try {
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas not supported")

    ctx.drawImage(bitmap, 0, 0, width, height)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality)
    )
    if (!blob) throw new Error("Compression failed")
    return blob
  } finally {
    bitmap.close()
  }
}
