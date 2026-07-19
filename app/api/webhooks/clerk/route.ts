import { Webhook } from "svix"
import { headers } from "next/headers"
import type { WebhookEvent, UserJSON } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { type Role } from "@/lib/clerk-utils"

export async function POST(req: Request) {
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!)

  const headerPayload = await headers()
  const svixId = headerPayload.get("svix-id")
  const svixTimestamp = headerPayload.get("svix-timestamp")
  const svixSignature = headerPayload.get("svix-signature")

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 })
  }

  const payload = await req.text()

  let evt: WebhookEvent
  try {
    evt = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent
  } catch {
    return new Response("Invalid signature", { status: 400 })
  }

  try {
    switch (evt.type) {
      case "user.created":
      case "user.updated": {
        const { id, email_addresses, first_name, last_name, image_url, public_metadata } = evt.data as UserJSON
        if (!id) break
        const email = email_addresses?.[0]?.email_address ?? ""
        const role = (public_metadata?.role as Role) ?? "EMPLOYEE"
        await prisma.user.upsert({
          where: { clerkId: id },
          update: { email, firstName: first_name, lastName: last_name, imageUrl: image_url },
          create: {
            clerkId: id,
            email,
            firstName: first_name,
            lastName: last_name,
            imageUrl: image_url,
            role,
          },
        })
        break
      }
      case "user.deleted": {
        const { id } = evt.data as { id: string }
        if (id) {
          await prisma.user.delete({ where: { clerkId: id } }).catch(() => {})
        }
        break
      }
    }
    return new Response("OK", { status: 200 })
  } catch (error) {
    console.error("Webhook handler error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
