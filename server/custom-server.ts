/**
 * Custom Next.js server that attaches Socket.IO for realtime notifications.
 *
 * Usage:
 *   Development:  npx tsx server/custom-server.ts
 *   Production:   npx tsx server/custom-server.ts   (after `npm run build`)
 */
import { createServer } from "http"
import next from "next"
import { getIO } from "./ws"

const dev = process.env.NODE_ENV !== "production"
const hostname = process.env.HOSTNAME ?? "localhost"
const port = Number(process.env.PORT ?? 3000)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res))

  // Attach Socket.IO to the same HTTP server
  getIO(httpServer)

  httpServer.listen(port, () => {
    console.log(
      `> Server listening on http://${hostname}:${port}` +
        (dev ? " (dev)" : " (prod)"),
    )
  })
})
