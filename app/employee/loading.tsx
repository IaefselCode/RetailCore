/**
 * Route-level loading boundary — intentionally renders nothing.
 *
 * The centered PageSkeleton is handled exclusively by RouteLoadingIndicator
 * (mounted in this layout), which shows it the moment a client navigation
 * starts and hides it when the new route commits. Rendering a skeleton here
 * too would make navigation flash two centered skeletons.
 */
export default function Loading() {
  return null
}
