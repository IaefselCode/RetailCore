import { randomUUID } from "crypto"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import sharp from "sharp"

export const STORAGE_BUCKET = "images"
export type ImageFolder = "products" | "avatars"

let client: SupabaseClient | null | undefined

function getAdminClient(): SupabaseClient | null {
  if (client !== undefined) return client
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  client = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null
  return client
}

export function getStorage() {
  const c = getAdminClient()
  return c ? c.storage.from(STORAGE_BUCKET) : null
}

export async function optimizeImage(
  buffer: Buffer,
  { maxDim = 800, quality = 72 }: { maxDim?: number; quality?: number } = {}
): Promise<Buffer> {
  return sharp(buffer, { failOn: "error" })
    .rotate()
    .resize({ width: maxDim, height: maxDim, fit: "inside", withoutEnlargement: true })
    .webp({ quality })
    .toBuffer()
}

export type UploadResult = { url: string } | { error: string }

export async function uploadImage(opts: {
  buffer: Buffer
  folder: ImageFolder
}): Promise<UploadResult> {
  const storage = getStorage()
  if (!storage) return { error: "Storage is not configured" }

  const key = `${opts.folder}/${randomUUID()}.webp`
  const { error } = await storage.upload(key, opts.buffer, {
    contentType: "image/webp",
    upsert: false,
  })
  if (error) return { error: error.message }

  const { data } = storage.getPublicUrl(key)
  return { url: data.publicUrl }
}

export function extractStorageKey(value: string): string | null {
  try {
    const u = new URL(value)
    const path = u.pathname
    const marker = `/object/public/${STORAGE_BUCKET}/`
    const idx = path.indexOf(marker)
    if (idx === -1) return null
    const key = path.slice(idx + marker.length)
    return key || null
  } catch {
    return value.startsWith(`${STORAGE_BUCKET}/`) ? value : null
  }
}

export async function deleteImage(value: string): Promise<void> {
  const storage = getStorage()
  if (!storage) return
  const key = extractStorageKey(value)
  if (!key) return
  await storage.remove([key])
}
