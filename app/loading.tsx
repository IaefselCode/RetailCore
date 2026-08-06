import { PageSkeleton } from "@/components/shared/page-skeleton"

/**
 * Root route loading boundary.
 *
 * Applies only to top-level routes that have no shell (e.g. `/login`, the
 * `(auth)` group, the home page) — routes where RouteLoadingIndicator is not
 * mounted, so a full reload still gets the minimal centered skeleton here.
 *
 * Admin/employee routes are NOT affected: their own loading boundaries
 * (`app/admin/loading.tsx`, `app/employee/loading.tsx`) render nothing, and
 * the centered navigation skeleton there is handled exclusively by
 * RouteLoadingIndicator.
 */
export default function Loading() {
  return <PageSkeleton />
}
