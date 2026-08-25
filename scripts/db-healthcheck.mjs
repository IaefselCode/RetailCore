import pg from "pg"
import dotenv from "dotenv"

dotenv.config({ override: true })

const { Pool } = pg

// All tables that should exist per prisma/schema.prisma
const EXPECTED_TABLES = [
  "User",
  "Shop",
  "Employee",
  "Category",
  "Product",
  "Inventory",
  "Sale",
  "SaleItem",
  "Notification",
  "AuthLog",
  "PasswordResetToken",
  "StockTransaction",
  "SystemSetting",
  "NotificationPreference",
  "AuditLog",
]

// ── Helpers ──────────────────────────────────────────────────────────────────
const pass = (msg) => console.log(`  ✅ ${msg}`)
const fail = (msg) => console.log(`  ❌ ${msg}`)
const warn = (msg) => console.log(`  ⚠️  ${msg}`)
const info = (msg) => console.log(`  ℹ️  ${msg}`)

let exitCode = 0

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const startTime = Date.now()

  console.log("\n🔍 RetailCore Database Health Check")
  console.log("─".repeat(50))

  // 1. Check environment
  console.log("\n📋 Environment")
  if (!process.env.DIRECT_URL) {
    fail("DIRECT_URL is not set in .env")
    process.exit(1)
  }
  pass("DIRECT_URL is set")

  // 2. Connect to database
  console.log("\n🔌 Connection")
  const pool = new Pool({ connectionString: process.env.DIRECT_URL })
  let client
  try {
    client = await pool.connect()
    const res = await client.query("SELECT current_database(), current_user, version()")
    const row = res.rows[0]
    pass(`Connected to database "${row.current_database}" as "${row.current_user}"`)
    info(`PostgreSQL ${row.version.split(",")[0]}`)
  } catch (err) {
    fail(`Connection failed: ${err.message}`)
    await pool.end()
    process.exit(1)
  }

  // 3. Check all expected tables exist
  console.log("\n📊 Tables")
  const tableRes = await client.query(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
  )
  const existingTables = new Set(tableRes.rows.map((r) => r.tablename))

  for (const table of EXPECTED_TABLES) {
    if (existingTables.has(table)) {
      pass(`${table}`)
    } else {
      fail(`${table} — MISSING`)
      exitCode = 1
    }
  }

  // 4. Check for unexpected tables (not in schema)
  const unexpected = [...existingTables].filter(
    (t) => !EXPECTED_TABLES.includes(t) && t !== "_prisma_migrations"
  )
  if (unexpected.length > 0) {
    warn(`Unexpected tables: ${unexpected.join(", ")}`)
  } else {
    pass("No unexpected tables")
  }

  // 5. Check RLS status
  console.log("\n🔒 Row Level Security (RLS)")
  const rlsRes = await client.query(
    `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename != '_prisma_migrations'`
  )
  const tablesWithRLS = rlsRes.rows.filter((r) => r.rowsecurity)
  const tablesWithoutRLS = rlsRes.rows.filter((r) => !r.rowsecurity)

  if (tablesWithRLS.length === 0) {
    pass(`RLS disabled on all ${tablesWithoutRLS.length} application tables`)
  } else {
    warn(`RLS enabled on ${tablesWithRLS.length} table(s):`)
    for (const t of tablesWithRLS) {
      info(`  ${t.tablename}`)
    }
  }

  // 6. Check for RLS policies
  console.log("\n📜 RLS Policies")
  const policiesRes = await client.query(
    `SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public'`
  )
  if (policiesRes.rows.length === 0) {
    pass("No RLS policies found")
  } else {
    warn(`${policiesRes.rows.length} RLS policy(ies) found:`)
    for (const p of policiesRes.rows) {
      info(`  ${p.tablename}.${p.policyname}`)
    }
  }

  // 7. Check table ownership
  console.log("\n👤 Table Ownership")
  const ownerRes = await client.query(
    `SELECT tablename, tableowner FROM pg_tables WHERE schemaname = 'public' AND tablename != '_prisma_migrations'`
  )
  const ownerGroups = {}
  for (const r of ownerRes.rows) {
    ownerGroups[r.tableowner] = (ownerGroups[r.tableowner] || 0) + 1
  }
  for (const [owner, count] of Object.entries(ownerGroups)) {
    pass(`${owner} owns ${count} table(s)`)
  }

  // 8. Check permissions for postgres role
  console.log("\n🔑 Permissions")
  const permRes = await client.query(
    `SELECT table_name, array_agg(DISTINCT privilege_type ORDER BY privilege_type) AS privileges
     FROM information_schema.role_table_grants
     WHERE table_schema = 'public' AND grantee = 'postgres'
     GROUP BY table_name`
  )
  if (permRes.rows.length >= EXPECTED_TABLES.length) {
    const allFull = permRes.rows.every((r) =>
      r.privileges.includes("SELECT") &&
      r.privileges.includes("INSERT") &&
      r.privileges.includes("UPDATE") &&
      r.privileges.includes("DELETE")
    )
    if (allFull) {
      pass(`postgres has full CRUD on all ${permRes.rows.length} tables`)
    } else {
      warn("postgres missing some CRUD permissions")
      for (const r of permRes.rows) {
        if (
          !r.privileges.includes("SELECT") ||
          !r.privileges.includes("INSERT") ||
          !r.privileges.includes("UPDATE") ||
          !r.privileges.includes("DELETE")
        ) {
          info(`  ${r.table_name}: ${r.privileges.join(", ")}`)
        }
      }
    }
  } else {
    warn(`Permissions found for ${permRes.rows.length}/${EXPECTED_TABLES.length} tables`)
  }

  // 9. Check Prisma migrations table
  console.log("\n📦 Prisma Migrations")
  if (existingTables.has("_prisma_migrations")) {
    const migRes = await client.query(
      `SELECT migration_name, finished_at FROM "_prisma_migrations" WHERE finished_at IS NOT NULL ORDER BY started_at`
    )
    pass(`${migRes.rows.length} applied migration(s):`)
    for (const m of migRes.rows) {
      info(`  ${m.migration_name}`)
    }

    // Check for truly failed migrations (no successful counterpart with same name)
    const failed = await client.query(`
      SELECT DISTINCT fm.migration_name
      FROM "_prisma_migrations" fm
      WHERE fm.finished_at IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM "_prisma_migrations" sm
          WHERE sm.migration_name = fm.migration_name
            AND sm.finished_at IS NOT NULL
        )
    `)
    if (failed.rows.length > 0) {
      fail(`${failed.rows.length} failed migration(s) (no successful run found):`)
      for (const m of failed.rows) {
        info(`  ${m.migration_name}`)
      }
      exitCode = 1
    } else {
      // Check for interrupted attempts (have a successful counterpart)
      const stale = await client.query(
        `SELECT COUNT(*) AS cnt FROM "_prisma_migrations" WHERE finished_at IS NULL`
      )
      if (Number(stale.rows[0].cnt) > 0) {
        info(`${stale.rows[0].cnt} interrupted attempt(s) cleaned up (have successful runs)`)
      }
    }
  } else {
    warn("_prisma_migrations table not found")
  }

  // 10. Quick write/read test
  console.log("\n🧪 Read Test")
  try {
    const userCount = await client.query(`SELECT COUNT(*) FROM "User"`)
    const shopCount = await client.query(`SELECT COUNT(*) FROM "Shop"`)
    const productCount = await client.query(`SELECT COUNT(*) FROM "Product"`)
    const saleCount = await client.query(`SELECT COUNT(*) FROM "Sale"`)
    pass(`Users: ${userCount.rows[0].count}, Shops: ${shopCount.rows[0].count}, Products: ${productCount.rows[0].count}, Sales: ${saleCount.rows[0].count}`)
  } catch (err) {
    fail(`Read test failed: ${err.message}`)
    exitCode = 1
  }

  // Summary
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)
  console.log("\n" + "─".repeat(50))
  if (exitCode === 0) {
    console.log(`\n✅ All checks passed (${elapsed}s)\n`)
  } else {
    console.log(`\n❌ Some checks failed — see above (${elapsed}s)\n`)
  }

  client.release()
  await pool.end()
  process.exit(exitCode)
}

main()
