import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * Server-Sent Events endpoint for real-time notifications.
 *
 * On Vercel serverless, each invocation can run for up to 60 s (Pro plan).
 * We poll the database every 3 s and flush new rows as SSE events. When the
 * function times out the browser's EventSource automatically reconnects with
 * the last-event-id header, so no notifications are lost.
 *
 * On a self-hosted Node server this runs indefinitely, giving true push.
 */
export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 })
  }

  const userId = session.user.id
  const encoder = new TextEncoder()

  // Parse Last-Event-ID sent by the browser on reconnect
  const lastEventId = request.headers.get("Last-Event-ID")

  // On first connect (no lastEventId), only send the current unread count
  // so the badge is accurate. On reconnect, send only newer notifications.
  let afterDate: Date
  if (lastEventId) {
    // lastEventId is the ISO timestamp of the last notification we sent
    afterDate = new Date(lastEventId)
  } else {
    // First connect — set "after" to now so we only count unread
    afterDate = new Date()
  }

  const stream = new ReadableStream({
    async start(controller) {
      // Helper to send an SSE event
      function sendEvent(event: string, data: string, id?: string) {
        const parts = []
        if (id) parts.push(`id: ${id}`)
        parts.push(`event: ${event}`)
        parts.push(`data: ${data}`)
        parts.push("", "") // double newline terminates the event
        controller.enqueue(encoder.encode(parts.join("\n")))
      }

      // Send initial connection confirmation with current unread count
      const unreadCount = await prisma.notification.count({
        where: { userId, isRead: false },
      })
      sendEvent("connected", JSON.stringify({ unreadCount }))

      let cancelled = false
      request.signal.addEventListener("abort", () => {
        cancelled = true
        try { controller.close() } catch { /* already closed */ }
      })

      // Poll loop — check for new notifications every 3 seconds
      while (!cancelled) {
        try {
          const newNotifications = await prisma.notification.findMany({
            where: {
              userId,
              createdAt: { gt: afterDate },
            },
            orderBy: { createdAt: "asc" },
            take: 50,
          })

          for (const n of newNotifications) {
            const ts = n.createdAt.toISOString()
            sendEvent(
              "notification",
              JSON.stringify({
                id: n.id,
                title: n.title,
                message: n.message,
                type: n.type,
                isRead: n.isRead,
                createdAt: ts,
              }),
              ts,
            )
            // Move the cursor forward
            if (n.createdAt > afterDate) {
              afterDate = n.createdAt
            }
          }
        } catch {
          // DB error — skip this cycle, try again next interval
        }

        // Wait 3 seconds before next poll
        await new Promise((resolve) => setTimeout(resolve, 3000))
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // nginx proxy hint
    },
  })
}
