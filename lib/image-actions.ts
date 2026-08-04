"use server"

import { auth } from "@/lib/auth"
import { MAX_UPLOAD_BYTES } from "@/lib/images"
import {
  deleteImage,
  optimizeImage,
  uploadImage,
  type ImageFolder,
} from "@/lib/images-server"

export type UploadImageResult = { url?: string; error?: string }

export async function uploadImageAction(
  formData: FormData
): Promise<UploadImageResult> {
  const session = await auth()
  if (!session?.user?.id) return { error: "Not signed in" }

  const folder = String(formData.get("folder") ?? "products") as ImageFolder
  if (folder !== "products" && folder !== "avatars") {
    return { error: "Invalid folder" }
  }

  const file = formData.get("file")
  if (!file || typeof file !== "object" || !("arrayBuffer" in file)) {
    return { error: "No file provided" }
  }
  const f = file as File
  if (f.size > MAX_UPLOAD_BYTES) {
    return { error: "Image must be 10MB or smaller." }
  }

  const source = Buffer.from(await f.arrayBuffer())

  let optimized: Buffer
  try {
    optimized = await optimizeImage(source, {
      maxDim: folder === "avatars" ? 400 : 800,
    })
  } catch {
    return { error: "Invalid image file." }
  }

  const result = await uploadImage({ buffer: optimized, folder })
  if ("error" in result) return { error: result.error }
  return { url: result.url }
}

export async function deleteImageAction(
  path: string
): Promise<{ success: boolean }> {
  const session = await auth()
  if (!session?.user?.id) return { success: false }
  await deleteImage(path)
  return { success: true }
}
