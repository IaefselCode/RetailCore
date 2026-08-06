import { auth } from "@/lib/auth"

export default auth

export const config = {
  matcher: [
    // Exclude API routes (incl. /api/auth) so NextAuth's route handlers
    // are reached directly, plus _next and static assets.
    "/((?!api|_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
}
