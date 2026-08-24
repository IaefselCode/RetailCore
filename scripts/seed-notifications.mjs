import { randomUUID } from "crypto"
import pg from "pg"

const pool = new pg.Pool({ connectionString: process.env.DIRECT_URL })

const notifications = [
  {
    email: "admin@retailcore.dev",
    items: [
      { title: "New shop created", message: "Downtown Flagship has been added as a new location", type: "system" },
      { title: "Low stock alert", message: "Wireless Mouse M210 is running low (7 units remaining)", type: "stock" },
      { title: "Sales milestone reached", message: "Total revenue has surpassed this quarter target", type: "milestone" },
      { title: "New employee onboarded", message: "Sarah Chen has been added to the Downtown Flagship team", type: "operational" },
      { title: "System maintenance scheduled", message: "Server downtime scheduled for Sunday 2:00 AM - 4:00 AM", type: "system" },
    ],
  },
  {
    email: "employee@retailcore.dev",
    items: [
      { title: "Shift Reminder", message: "Your shift starts in 30 minutes", type: "info" },
      { title: "New Product Added", message: "SonicFlow X1 has been added to the catalog", type: "info" },
      { title: "Weekly Sales Summary", message: "Your weekly sales summary is now available", type: "info" },
      { title: "Stock Alert", message: "DataSync Hub is critically low (1 remaining)", type: "stock" },
      { title: "Schedule Update", message: "Your shift for next week has been updated", type: "info" },
    ],
  },
]

for (const group of notifications) {
  const user = await pool.query(`SELECT id FROM "User" WHERE email = $1`, [group.email])
  if (user.rows.length === 0) {
    console.log("skip", group.email, "(user not found)")
    continue
  }
  const userId = user.rows[0].id
  await pool.query(`UPDATE "Notification" SET "isRead" = true WHERE "userId" = $1`, [userId])
  for (const n of group.items) {
    await pool.query(
      `INSERT INTO "Notification" (id, "userId", title, message, type, "isRead", "createdAt")
       VALUES ($1, $2, $3, $4, $5, false, now() - interval '1 minute')`,
      [randomUUID(), userId, n.title, n.message, n.type],
    )
  }
  console.log("seeded notifications for", group.email)
}

await pool.end()
