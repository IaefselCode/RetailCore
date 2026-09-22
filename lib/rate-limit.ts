import { prisma } from "@/lib/prisma"

/**
 * Durable rate limiting backed by Postgres (RateLimitBucket table).
 *
 * The counter is incremented atomically via INSERT ... ON CONFLICT DO
 * UPDATE, so concurrent requests cannot race past the limit and buckets
 * survive server restarts and are shared across server instances.
 *
 * If the database is temporarily unreachable we fall back to a
 * per-instance in-memory store so login keeps working (protection
 * degrades from cluster-wide to per-instance instead of failing hard).
 */

type Bucket = { count: number; resetAt: number }

const memoryStore = new Map<string, Bucket>()
const MAX_BUCKETS = 10_000

function memoryRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  if (memoryStore.size >= MAX_BUCKETS) {
    for (const [k, bucket] of memoryStore) {
      if (bucket.resetAt <= now) memoryStore.delete(k)
    }
  }

  const bucket = memoryStore.get(key)
  if (!bucket || bucket.resetAt <= now) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  bucket.count++
  return bucket.count <= max
}

function memoryIsRateLimited(key: string, max: number): boolean {
  const bucket = memoryStore.get(key)
  if (!bucket || bucket.resetAt <= Date.now()) return false
  return bucket.count >= max
}

/**
 * Consume one unit from the bucket identified by `key`.
 * Returns true while the bucket is within `max` for the current
 * `windowMs` window; false once the limit is exceeded.
 */
export async function rateLimit(
  key: string,
  max: number,
  windowMs: number
): Promise<boolean> {
  const resetAt = new Date(Date.now() + windowMs)

  try {
    const rows = await prisma.$queryRaw<Array<{ count: number }>>`
      INSERT INTO "RateLimitBucket" ("key", "count", "resetAt", "updatedAt")
      VALUES (${key}, 1, ${resetAt}, NOW())
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE
          WHEN "RateLimitBucket"."resetAt" <= NOW() THEN 1
          ELSE "RateLimitBucket"."count" + 1
        END,
        "resetAt" = CASE
          WHEN "RateLimitBucket"."resetAt" <= NOW() THEN ${resetAt}
          ELSE "RateLimitBucket"."resetAt"
        END,
        "updatedAt" = NOW()
      RETURNING "count"`

    // Opportunistic cleanup keeps the table tiny without a cron job.
    if (Math.random() < 0.01) {
      void prisma.rateLimitBucket
        .deleteMany({ where: { resetAt: { lt: new Date() } } })
        .catch(() => {})
    }

    return rows[0].count <= max
  } catch (error) {
    console.error("rate-limit: DB unavailable, using in-memory fallback", error)
    return memoryRateLimit(key, max, windowMs)
  }
}

/** Read-only check — returns true if the key has already exceeded max. */
export async function isRateLimited(key: string, max: number): Promise<boolean> {
  try {
    const row = await prisma.rateLimitBucket.findUnique({ where: { key } })
    if (!row || row.resetAt.getTime() <= Date.now()) return false
    return row.count >= max
  } catch (error) {
    console.error("rate-limit: DB unavailable, using in-memory fallback", error)
    return memoryIsRateLimited(key, max)
  }
}

export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for")
  return xff?.split(",")[0]?.trim() || "unknown"
}
