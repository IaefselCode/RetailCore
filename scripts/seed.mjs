import bcrypt from "bcryptjs"
import { randomUUID } from "crypto"
import pg from "pg"

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rnd = mulberry32(20260804)
const pick = (arr) => arr[Math.floor(rnd() * arr.length)]

const categories = [
  "Electronics",
  "Clothing",
  "Groceries",
  "Footwear",
  "Accessories",
  "Home & Kitchen",
]

const shops = [
  { name: "RetailCore Main Branch", city: "Dar es Salaam", phone: "+255 700 100 001" },
  { name: "RetailCore Mikocheni", city: "Dar es Salaam", phone: "+255 700 100 002" },
  { name: "RetailCore Mbezi", city: "Dar es Salaam", phone: "+255 700 100 003" },
]

const products = [
  { name: "Bluetooth Speaker X1", sku: "RC-ELC-001", price: 45000, cost: 30000, category: "Electronics" },
  { name: "Wireless Mouse M210", sku: "RC-ELC-002", price: 18000, cost: 12000, category: "Electronics" },
  { name: "USB-C Cable 2m", sku: "RC-ELC-003", price: 8000, cost: 4500, category: "Electronics" },
  { name: "Men's Cotton Shirt", sku: "RC-CLT-001", price: 25000, cost: 15000, category: "Clothing" },
  { name: "Women's Summer Dress", sku: "RC-CLT-002", price: 38000, cost: 22000, category: "Clothing" },
  { name: "Kids T-Shirt Pack", sku: "RC-CLT-003", price: 20000, cost: 12000, category: "Clothing" },
  { name: "Cooking Oil 2L", sku: "RC-GRC-001", price: 14000, cost: 11500, category: "Groceries" },
  { name: "Maize Flour 5kg", sku: "RC-GRC-002", price: 15000, cost: 12000, category: "Groceries" },
  { name: "Sugar 1kg", sku: "RC-GRC-003", price: 5000, cost: 4200, category: "Groceries" },
  { name: "Running Shoes 42", sku: "RC-FTW-001", price: 65000, cost: 40000, category: "Footwear" },
  { name: "Leather Belt", sku: "RC-ACC-001", price: 15000, cost: 8000, category: "Accessories" },
  { name: "Stainless Cookware Set", sku: "RC-HOM-001", price: 120000, cost: 85000, category: "Home & Kitchen" },
]

const staff = [
  {
    email: "employee@retailcore.dev",
    firstName: "RetailCore",
    lastName: "Employee",
    role: "EMPLOYEE",
    position: "Cashier",
    shop: "RetailCore Main Branch",
    newPassword: null,
  },
  {
    email: "asha@retailcore.dev",
    firstName: "Asha",
    lastName: "Mwenda",
    role: "EMPLOYEE",
    position: "Cashier",
    shop: "RetailCore Mikocheni",
    newPassword: "Rc!Asha2026!",
  },
  {
    email: "joseph@retailcore.dev",
    firstName: "Joseph",
    lastName: "Kimaro",
    role: "EMPLOYEE",
    position: "Sales Associate",
    shop: "RetailCore Mbezi",
    newPassword: "Rc!Joseph2026!",
  },
]

const paymentMethods = ["CASH", "CARD", "MOBILE"]
const statuses = ["COMPLETED", "COMPLETED", "COMPLETED", "COMPLETED", "CANCELLED"]

const categoryIds = {}
for (const name of categories) {
  const res = await pool.query(
    `INSERT INTO "Category" (id, name, "createdAt", "updatedAt") VALUES ($1, $2, now(), now())
     ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name, "updatedAt" = now() RETURNING id`,
    [randomUUID(), name],
  )
  categoryIds[name] = res.rows[0].id
}
console.log("categories:", categories.length)

const shopIds = {}
for (const s of shops) {
  const existing = (await pool.query(`SELECT id FROM "Shop" WHERE name = $1`, [s.name])).rows[0]
  if (!existing) {
    await pool.query(
      `INSERT INTO "Shop" (id, name, city, phone, "isActive", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, true, now(), now())`,
      [randomUUID(), s.name, s.city, s.phone],
    )
    shopIds[s.name] = (await pool.query(`SELECT id FROM "Shop" WHERE name = $1`, [s.name])).rows[0]
      .id
  } else {
    shopIds[s.name] = existing.id
  }
}
console.log("shops:", Object.keys(shopIds).length)

const productIds = {}
for (const p of products) {
  const res = await pool.query(
    `INSERT INTO "Product" (id, name, sku, description, price, cost, "categoryId", "isActive", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, true, now(), now())
     ON CONFLICT (sku) DO UPDATE SET
       name = EXCLUDED.name,
       price = EXCLUDED.price,
       cost = EXCLUDED.cost,
       "categoryId" = EXCLUDED."categoryId",
       "isActive" = true,
       "updatedAt" = now()
     RETURNING id`,
    [randomUUID(), p.name, p.sku, null, p.price, p.cost, categoryIds[p.category]],
  )
  productIds[p.sku] = res.rows[0].id
}
console.log("products:", products.length)

for (const s of shops) {
  for (const p of products) {
    const qty = 8 + Math.floor(rnd() * 90)
    const min = 5 + Math.floor(rnd() * 15)
    const max = min * 3
    await pool.query(
      `INSERT INTO "Inventory" (id, "productId", "shopId", quantity, "minStock", "maxStock", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, now(), now())
       ON CONFLICT ("productId", "shopId") DO UPDATE SET
         quantity = EXCLUDED.quantity,
         "minStock" = EXCLUDED."minStock",
         "maxStock" = EXCLUDED."maxStock",
         "updatedAt" = now()`,
      [randomUUID(), productIds[p.sku], shopIds[s.name], qty, min, max],
    )
  }
}
console.log("inventory rows:", shops.length * products.length)

const employeeIds = {}
for (const e of staff) {
  const existing = (await pool.query(`SELECT id FROM "User" WHERE email = $1`, [e.email])).rows[0]
  let userId = existing?.id
  if (!userId) {
    const hash = await bcrypt.hash(e.newPassword, 12)
    const res = await pool.query(
      `INSERT INTO "User" (id, email, "passwordHash", "firstName", "lastName", role, "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, true, now(), now()) RETURNING id`,
      [randomUUID(), e.email, hash, e.firstName, e.lastName, e.role],
    )
    userId = res.rows[0].id
    console.log("created staff:", e.email, `(password: ${e.newPassword})`)
  } else {
    await pool.query(
      `UPDATE "User" SET "firstName" = $1, "lastName" = $2, "isActive" = true, "updatedAt" = now()
       WHERE id = $3`,
      [e.firstName, e.lastName, userId],
    )
  }
  if (e.role === "EMPLOYEE") {
    const res = await pool.query(
      `INSERT INTO "Employee" (id, "userId", "shopId", position, "hireDate", salary, "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, now(), 0, true, now(), now())
       ON CONFLICT ("userId") DO UPDATE SET
         "shopId" = EXCLUDED."shopId",
         position = EXCLUDED.position,
         "isActive" = true,
         "updatedAt" = now()
       RETURNING id`,
      [randomUUID(), userId, shopIds[e.shop], e.position],
    )
    employeeIds[e.email] = res.rows[0].id
  }
}
console.log("employees:", Object.keys(employeeIds).length)

const saleEmployees = [staff[0].email, staff[1].email, staff[2].email]

for (let i = 0; i < 14; i++) {
  const shopName = pick(shops.map((s) => s.name))
  const date = new Date(Date.now() - i * 36e5 * 26)
  const invoiceNo = `RC-${date.toISOString().slice(0, 10).replace(/-/g, "")}-${String(
    1000 + Math.floor(rnd() * 9000),
  ).slice(0, 4)}`

  const itemCount = 1 + Math.floor(rnd() * 3)
  const itemSkus = []
  while (itemSkus.length < itemCount) {
    const sku = pick(products.map((p) => p.sku))
    if (!itemSkus.includes(sku)) itemSkus.push(sku)
  }

  let subtotal = 0
  const items = itemSkus.map((sku) => {
    const p = products.find((x) => x.sku === sku)
    const qty = 1 + Math.floor(rnd() * 3)
    const line = qty * p.price
    subtotal += line
    return { sku, qty, unitPrice: p.price, subtotal: line }
  })

  const discount = Math.floor(rnd() * 3) === 0 ? Math.round(subtotal * 0.05) : 0
  const tax = Math.round((subtotal - discount) * 0.18)
  const total = subtotal - discount + tax
  const status = pick(statuses)
  const employeeEmail = pick(saleEmployees)

  const saleRes = await pool.query(
    `INSERT INTO "Sale" (id, "invoiceNo", "employeeId", "shopId", "customerName", subtotal, tax, discount, total, "paymentMethod", status, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now())
     ON CONFLICT ("invoiceNo") DO NOTHING RETURNING id`,
    [
      randomUUID(),
      invoiceNo,
      employeeIds[employeeEmail],
      shopIds[shopName],
      pick(["Juma Hassan", "Neema John", "Fatuma Ali", "Baraka Mushi", null]),
      subtotal,
      tax,
      discount,
      total,
      pick(paymentMethods),
      status,
      date,
    ],
  )

  if (saleRes.rowCount === 1) {
    for (const it of items) {
      await pool.query(
        `INSERT INTO "SaleItem" (id, "saleId", "productId", quantity, "unitPrice", subtotal)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [randomUUID(), saleRes.rows[0].id, productIds[it.sku], it.qty, it.unitPrice, it.subtotal],
      )
      if (status === "COMPLETED") {
        await pool.query(
          `UPDATE "Inventory" SET quantity = quantity - $1, "updatedAt" = now()
           WHERE "productId" = $2 AND "shopId" = $3`,
          [it.qty, productIds[it.sku], shopIds[shopName]],
        )
      }
    }
    console.log("sale:", invoiceNo, `${status}`, `TZS ${total.toLocaleString()}`)
  }
}

await pool.end()
console.log("seed complete")
