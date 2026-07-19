import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isPublicRoute = createRouteMatcher([
  "/",
  "/(auth)(.*)",
  "/api/webhooks(.*)",
  "/_next(.*)",
  "/favicon.ico",
])

const isAdminRoute = createRouteMatcher(["/admin(.*)"])
const isEmployeeRoute = createRouteMatcher(["/employee(.*)"])

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return

  await auth.protect()

  const { sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as { role?: string })?.role

  if (isAdminRoute(req) && role !== "SUPER_ADMIN" && role !== "ADMIN" && role !== "MANAGER") {
    await auth.protect()
  }

  if (isEmployeeRoute(req) && !role) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
