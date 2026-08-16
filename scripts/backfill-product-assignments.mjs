// Backfills product → shop assignments for products created before the
// shop-assignment feature existed. Assigns every product to every active shop
// (quantity 0) so existing products keep appearing for employees, matching the
// previous "everyone sees everything" behavior.
//
// Idempotent: existing Inventory rows (including quantities) are untouched.
//   node scripts/backfill-product-assignments.mjs
import pg from "pg"

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

const products = await pool.query(`SELECT id FROM "Product"`)
const shops = await pool.query(`SELECT id FROM "Shop" WHERE "isActive" = true`)
const existing = await pool.query(`SELECT "productId", "shopId" FROM "Inventory"`)
const existingKeys = new Set(existing.rows.map((r) => `${r.productId}|${r.shopId}`))

let created = 0
for (const p of products.rows) {
  for (const s of shops.rows) {
    if (existingKeys.has(`${p.id}|${s.id}`)) continue
    await pool.query(
      `INSERT INTO "Inventory" (id, "productId", "shopId", quantity, "minStock", "maxStock", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, 0, 0, 0, now(), now())`,
      [p.id, s.id],
    )
    created++
  }
}

console.log(`products: ${products.rowCount}, active shops: ${shops.rowCount}`)
console.log(`inventory rows created: ${created}`)
await pool.end()
