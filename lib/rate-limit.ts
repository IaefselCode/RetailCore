type Bucket = { count: number; resetAt: number }

const store = new Map<string, Bucket>()
const MAX_BUCKETS = 10_000

function prune(now: number) {
  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) store.delete(key)
  }
}

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  if (store.size >= MAX_BUCKETS) prune(now)

  const bucket = store.get(key)
  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  bucket.count++
  return bucket.count <= max
}

export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for")
  return xff?.split(",")[0]?.trim() || "unknown"
}
