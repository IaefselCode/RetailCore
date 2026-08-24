import { Server as SocketIOServer } from "socket.io"
import type { Server as HTTPServer } from "http"

let io: SocketIOServer | null = null

/**
 * Initialise (or return the existing) Socket.IO server attached to the
 * given HTTP server.  Call this once from the custom Next.js server and
 * from nowhere else.
 */
export function getIO(httpServer?: HTTPServer): SocketIOServer {
  if (io) return io

  if (!httpServer) {
    throw new Error("Socket.IO has not been initialised yet. Pass an HTTP server on first call.")
  }

  io = new SocketIOServer(httpServer, {
    path: "/api/ws",
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  })

  io.on("connection", (socket) => {
    // The client sends a "register" event with their userId after connecting.
    socket.on("register", (userId: string) => {
      if (userId) {
        socket.join(`user:${userId}`)
      }
    })

    socket.on("disconnect", () => {
      // rooms are cleaned up automatically
    })
  })

  console.log("[ws] Socket.IO server ready on /api/ws")
  return io
}

/** Return the current Socket.IO instance (or null if not started). */
export function getIOOrNull(): SocketIOServer | null {
  return io
}
