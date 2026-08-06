import { PageSkeleton } from "@/components/shared/page-skeleton"

/**
 * Employee route loading boundary — the minimal centered skeleton.
 *
 * Next.js renders this inside the shell's content region while the target
 * route's data is being fetched (reloads and slow client navigations), so it
 * shows "loading" where the new page will appear instead of covering the old
 * page. Fast prefetched navigations commit instantly and never flash it.
 */
export default function Loading() {
  return <PageSkeleton />
}
