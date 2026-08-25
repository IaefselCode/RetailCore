import { randomUUID } from "crypto"
import { mkdir, unlink, writeFile } from "fs/promises"
import path from "path"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import sharp from "sharp"

export const STORAGE_BUCKET = "images"
export type ImageFolder = "products" | "avatars" | "profiles"

/**
 * Where uploaded files are stored.
 *
 *   - "local"    (default) — writes to public/uploads/<folder>/<uuid>.webp and
 *                 serves them at /uploads/<folder>/<uuid>.webp. Perfect for
 *                 local development with zero configuration.
 *   - "supabase" — uploads to Supabase Storage. Requires SUPABASE_URL and
 *                 SUPABASE_SERVICE_ROLE_KEY in the environment.
 *
 * Switching providers is a pure env change — no code changes needed:
 *   STORAGE_PROVIDER=supabase
 *   SUPABASE_URL=https://<project>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
 */
export type StorageProvider = "local" | "supabase"

export function getStorageProvider(): StorageProvider {
  return process.env.STORAGE_PROVIDER === "supabase" ? "supabase" : "local"
}

/** Local uploads live under the Next.js public dir so they are served statically. */
export const LOCAL_UPLOADS_DIR = path.join(process.cwd(), "public", "uploads")

// ---------------------------------------------------------------------------
// Supabase provider
// ---------------------------------------------------------------------------

let client: SupabaseClient | null | undefined
let bucketEnsured = false

function getAdminClient(): SupabaseClient | null {
  if (client !== undefined) return client
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  client = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null
  return client
}

async function ensureBucket(): Promise<void> {
  if (bucketEnsured) return
  const c = getAdminClient()
  if (!c) return
  const { data: buckets } = await c.storage.listBuckets()
  if (buckets?.some((b) => b.name === STORAGE_BUCKET)) {
    bucketEnsured = true
    return
  }
  await c.storage.createBucket(STORAGE_BUCKET, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  })
  bucketEnsured = true
}

async function getStorage() {
  const c = getAdminClient()
  if (!c) return null
  await ensureBucket()
  return c.storage.from(STORAGE_BUCKET)
}

/** Extracts the bucket key from a Supabase public URL. */
export function extractStorageKey(value: string): string | null {
  try {
    const u = new URL(value)
    const pathname = u.pathname
    const marker = `/object/public/${STORAGE_BUCKET}/`
    const idx = pathname.indexOf(marker)
    if (idx === -1) return null
    const key = pathname.slice(idx + marker.length)
    return key || null
  } catch {
    return value.startsWith(`${STORAGE_BUCKET}/`) ? value : null
  }
}

// ---------------------------------------------------------------------------
// Local filesystem provider
// ---------------------------------------------------------------------------

/** Extracts "/uploads/<folder>/<file>" from a local URL (relative or absolute). */
export function extractLocalPath(value: string): string | null {
  let pathname = value
  try {
    pathname = new URL(value).pathname
  } catch {
    // Already a relative path like "/uploads/products/x.webp"
  }
  const marker = "/uploads/"
  const idx = pathname.indexOf(marker)
  if (idx === -1) return null
  const rel = pathname.slice(idx + marker.length) // "<folder>/<file>"
  const parts = rel.split("/").filter(Boolean)
  // Defend against path traversal: exactly <folder>/<file> expected.
  if (parts.length !== 2) return null
  return path.join(LOCAL_UPLOADS_DIR, parts[0], parts[1])
}

async function saveLocal(buffer: Buffer, folder: ImageFolder): Promise<string> {
  const dir = path.join(LOCAL_UPLOADS_DIR, folder)
  await mkdir(dir, { recursive: true })
  const filename = `${randomUUID()}.webp`
  await writeFile(path.join(dir, filename), buffer)
  return `/uploads/${folder}/${filename}`
}

async function deleteLocal(value: string): Promise<void> {
  const abs = extractLocalPath(value)
  if (!abs) return
  await unlink(abs).catch(() => {
    // File may already be gone — nothing to do.
  })
}

// ---------------------------------------------------------------------------
// Shared API (used by server actions)
// ---------------------------------------------------------------------------

/**
 * Server-side re-compression backstop. Runs BEFORE the file is uploaded so the
 * stored file is always a bounded, optimized WebP regardless of what the
 * client sent (the client also compresses first in ImageUpload).
 */
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
  if (getStorageProvider() === "local") {
    const url = await saveLocal(opts.buffer, opts.folder)
    return { url }
  }

  const storage = await getStorage()
  if (!storage) {
    return {
      error:
        "Supabase storage is not configured. Set STORAGE_PROVIDER=supabase with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, or use STORAGE_PROVIDER=local for filesystem uploads.",
    }
  }

  const key = `${opts.folder}/${randomUUID()}.webp`
  const { error } = await storage.upload(key, opts.buffer, {
    contentType: "image/webp",
    upsert: false,
  })
  if (error) return { error: error.message }

  const { data } = storage.getPublicUrl(key)
  return { url: data.publicUrl }
}

export async function deleteImage(value: string): Promise<void> {
  if (getStorageProvider() === "local") {
    await deleteLocal(value)
    return
  }

  const storage = await getStorage()
  if (!storage) return
  const key = extractStorageKey(value)
  if (!key) return
  await storage.remove([key])
}
