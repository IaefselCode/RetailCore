import bcrypt from "bcryptjs"
import { randomUUID } from "crypto"
import pg from "pg"

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

const users = [
  {
    email: "admin@retailcore.dev",
    firstName: "RetailCore",
    lastName: "Admin",
    role: "ADMIN",
    password: "Rc!iMIw7qQI$PzsvDQ",
  },
  {
    email: "employee@retailcore.dev",
    firstName: "RetailCore",
    lastName: "Employee",
    role: "EMPLOYEE",
    password: "Rc!I_EFKcZr$V61eyw",
  },
  {
    email: "davidmodestus868@gmail.com",
    firstName: "David",
    lastName: "Modestus",
    role: "ADMIN",
    password: "Rc!YF4raV68$MXL7nQ",
  },
]

for (const u of users) {
  const hash = await bcrypt.hash(u.password, 12)
  await pool.query(
    `INSERT INTO "User" (id, email, "passwordHash", "firstName", "lastName", role, "isActive", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, true, now(), now())
     ON CONFLICT (email) DO UPDATE
       SET "passwordHash" = EXCLUDED."passwordHash",
           "firstName" = EXCLUDED."firstName",
           "lastName" = EXCLUDED."lastName",
           role = EXCLUDED.role,
           "isActive" = true,
           "updatedAt" = now()`,
    [randomUUID(), u.email, hash, u.firstName, u.lastName, u.role],
  )
  console.log("seeded", u.email, `(${u.role})`)
}

const legacy = await pool.query(
  `DELETE FROM "User" WHERE email IN ('admin-test@retailcore.dev', 'emp-test@retailcore.dev')`,
)
console.log("removed legacy test accounts:", legacy.rowCount)

await pool.end()
