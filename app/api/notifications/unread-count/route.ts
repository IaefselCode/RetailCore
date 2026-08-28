import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * Lightweight polling endpoint — returns just the unread notification count.
 * Used as a fallback when the SSE connection drops (e.g. Vercel serverless
 * function timeout). The client polls this every 30 s as insurance.
 */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ unreadCount: 0 })
  }

  const unreadCount = await prisma.notification.count({
    where: { userId: session.user.id, isRead: false },
  })

  return Response.json({ unreadCount })
}
