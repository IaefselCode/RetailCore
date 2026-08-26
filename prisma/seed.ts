// prisma/seed.ts
//
// Seed script for the Point of Sale schema.
// Wired up as `migrations.seed` in prisma.config.ts, so a plain
// `npx prisma db seed` (or `prisma migrate dev`) runs this automatically.
// No extra config needed — just drop this file at prisma/seed.ts.
//
// Design notes:
// - Uses the driver adapter (@prisma/adapter-pg) against DIRECT_URL, exactly
//   like prisma.config.ts does for migrations — pooled connections (PgBouncer)
//   don't reliably support the prepared statements Prisma issues here.
// - Every write is an `upsert` (or guarded create) keyed on a real unique
//   constraint from schema.prisma, so the script is safe to re-run against a
//   database that already has seed data in it.
// - Money fields are Decimal(10,2) in the DB; we pass numbers/strings and let
//   Prisma coerce them, but we keep arithmetic in "cents-safe" increments
//   (two decimal places) to avoid floating point drift.

import dotenv from "dotenv";
dotenv.config({ override: true });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, UserRole, SaleStatus } from "../lib/generated/prisma/client";
import bcrypt from "bcryptjs";

const directUrl = process.env.DIRECT_URL;
if (!directUrl) {
  throw new Error(
    "DIRECT_URL is not set. Seeding requires a direct database connection.",
  );
}

const adapter = new PrismaPg({ connectionString: directUrl });
const prisma = new PrismaClient({ adapter });

// Default password for every seeded login. Change/rotate before using this
// against anything other than a local/dev database.
const DEFAULT_PASSWORD = "Password123!";

async function hash(password: string) {
  return bcrypt.hash(password, 10);
}

// ---------------------------------------------------------------------------
// Static reference data
// ---------------------------------------------------------------------------

const SHOPS = [
  {
    name: "Downtown Store",
    address: "123 Market Street",
    city: "Dar es Salaam",
    state: "Ilala",
    zipCode: "11101",
    phone: "+255-22-211-0001",
  },
  {
    name: "Uptown Branch",
    address: "45 Mwenge Avenue",
    city: "Dar es Salaam",
    state: "Kinondoni",
    zipCode: "14112",
    phone: "+255-22-211-0002",
  },
] as const;

const CATEGORIES = [
  { name: "Beverages", description: "Soft drinks, juices, water, and other drinks" },
  { name: "Snacks", description: "Chips, biscuits, and packaged snacks" },
  { name: "Groceries", description: "Everyday pantry and household food staples" },
  { name: "Electronics", description: "Small electronics and accessories" },
  { name: "Household", description: "Cleaning and general household supplies" },
] as const;

// price/cost are strings so Prisma parses them as exact Decimals.
const PRODUCTS = [
  { name: "Coca-Cola 500ml", sku: "BEV-001", category: "Beverages", price: "1.50", cost: "0.90" },
  { name: "Bottled Water 1L", sku: "BEV-002", category: "Beverages", price: "0.80", cost: "0.40" },
  { name: "Orange Juice 1L", sku: "BEV-003", category: "Beverages", price: "2.20", cost: "1.40" },
  { name: "Potato Chips 150g", sku: "SNK-001", category: "Snacks", price: "1.75", cost: "1.05" },
  { name: "Chocolate Bar", sku: "SNK-002", category: "Snacks", price: "1.20", cost: "0.70" },
  { name: "Digestive Biscuits", sku: "SNK-003", category: "Snacks", price: "2.00", cost: "1.25" },
  { name: "Rice 5kg", sku: "GRO-001", category: "Groceries", price: "9.99", cost: "7.50" },
  { name: "Cooking Oil 2L", sku: "GRO-002", category: "Groceries", price: "6.50", cost: "4.80" },
  { name: "Sugar 2kg", sku: "GRO-003", category: "Groceries", price: "3.40", cost: "2.30" },
  { name: "USB-C Cable 1m", sku: "ELE-001", category: "Electronics", price: "5.99", cost: "2.50" },
  { name: "Wireless Earbuds", sku: "ELE-002", category: "Electronics", price: "24.99", cost: "14.00" },
  { name: "Power Bank 10000mAh", sku: "ELE-003", category: "Electronics", price: "19.99", cost: "12.00" },
  { name: "Dish Soap 750ml", sku: "HH-001", category: "Household", price: "2.50", cost: "1.60" },
  { name: "Laundry Detergent 2kg", sku: "HH-002", category: "Household", price: "7.25", cost: "5.00" },
  { name: "Paper Towels (2-pack)", sku: "HH-003", category: "Household", price: "3.10", cost: "1.90" },
] as const;

const USERS = [
  {
    email: "admin@possystem.local",
    firstName: "Amina",
    lastName: "Hassan",
    phone: "+255-71-000-0001",
    role: UserRole.ADMIN,
    shop: null as (typeof SHOPS)[number]["name"] | null,
    position: null as string | null,
  },
  {
    email: "manager.downtown@possystem.local",
    firstName: "John",
    lastName: "Mwakalinga",
    phone: "+255-71-000-0002",
    role: UserRole.EMPLOYEE,
    shop: "Downtown Store",
    position: "Store Manager",
  },
  {
    email: "cashier1.downtown@possystem.local",
    firstName: "Grace",
    lastName: "Mushi",
    phone: "+255-71-000-0003",
    role: UserRole.EMPLOYEE,
    shop: "Downtown Store",
    position: "Cashier",
  },
  {
    email: "manager.uptown@possystem.local",
    firstName: "Peter",
    lastName: "Kileo",
    phone: "+255-71-000-0004",
    role: UserRole.EMPLOYEE,
    shop: "Uptown Branch",
    position: "Store Manager",
  },
  {
    email: "cashier1.uptown@possystem.local",
    firstName: "Fatuma",
    lastName: "Juma",
    phone: "+255-71-000-0005",
    role: UserRole.EMPLOYEE,
    shop: "Uptown Branch",
    position: "Cashier",
  },
] as const;

const round2 = (n: number) => Math.round(n * 100) / 100;

async function main() {
  console.log("🌱 Seeding database...");
  const passwordHash = await hash(DEFAULT_PASSWORD);

  // -------------------------------------------------------------------------
  // Shops
  // -------------------------------------------------------------------------
  // Shop.name has no @unique constraint in the schema, so we can't upsert
  // on it directly — guard with findFirst instead.
  const shopByName = new Map<string, { id: string }>();
  for (const shop of SHOPS) {
    let record = await prisma.shop.findFirst({ where: { name: shop.name } });
    if (!record) {
      record = await prisma.shop.create({ data: { ...shop } });
    }
    shopByName.set(shop.name, record);
  }
  console.log(`✅ Shops: ${shopByName.size}`);

  // -------------------------------------------------------------------------
  // Users (+ Employee + NotificationPreference for each)
  // -------------------------------------------------------------------------
  const userByEmail = new Map<string, { id: string }>();
  for (const u of USERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        phone: u.phone,
        role: u.role,
        locale: "en",
      },
    });
    userByEmail.set(u.email, user);

    if (u.shop) {
      const shop = shopByName.get(u.shop);
      if (!shop) throw new Error(`Unknown shop "${u.shop}" for user ${u.email}`);
      await prisma.employee.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          shopId: shop.id,
          position: u.position,
          hireDate: new Date("2024-01-15"),
          salary: 0,
        },
      });
    }

    await prisma.notificationPreference.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });
  }
  console.log(`✅ Users + Employees: ${userByEmail.size}`);

  const adminUser = userByEmail.get("admin@possystem.local")!;

  // -------------------------------------------------------------------------
  // Categories
  // -------------------------------------------------------------------------
  const categoryByName = new Map<string, { id: string }>();
  for (const c of CATEGORIES) {
    const record = await prisma.category.upsert({
      where: { name: c.name },
      update: {},
      create: { name: c.name, description: c.description },
    });
    categoryByName.set(c.name, record);
  }
  console.log(`✅ Categories: ${categoryByName.size}`);

  // -------------------------------------------------------------------------
  // Products (+ Inventory + initial StockTransaction per shop)
  // -------------------------------------------------------------------------
  const productBySku = new Map<string, { id: string; price: string; cost: string }>();
  for (const p of PRODUCTS) {
    const category = categoryByName.get(p.category);
    if (!category) throw new Error(`Unknown category "${p.category}" for product ${p.sku}`);

    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        name: p.name,
        sku: p.sku,
        price: p.price,
        cost: p.cost,
        categoryId: category.id,
      },
    });
    productBySku.set(p.sku, { id: product.id, price: p.price, cost: p.cost });

    for (const shop of SHOPS) {
      const shopRecord = shopByName.get(shop.name)!;
      const initialQty = 100;

      await prisma.inventory.upsert({
        where: { productId_shopId: { productId: product.id, shopId: shopRecord.id } },
        update: {},
        create: {
          productId: product.id,
          shopId: shopRecord.id,
          quantity: initialQty,
          minStock: 15,
          maxStock: 200,
        },
      });

      // Only log the "initial stock" transaction the first time this
      // (product, shop) pair is seeded — cheap idempotency check.
      const existingTxn = await prisma.stockTransaction.findFirst({
        where: { productId: product.id, shopId: shopRecord.id, type: "INITIAL_STOCK" },
      });
      if (!existingTxn) {
        await prisma.stockTransaction.create({
          data: {
            type: "INITIAL_STOCK",
            productId: product.id,
            shopId: shopRecord.id,
            quantity: initialQty,
            reference: "SEED",
            notes: "Initial stock loaded by seed script",
          },
        });
      }
    }
  }
  console.log(`✅ Products: ${productBySku.size} (x${SHOPS.length} shops for inventory)`);

  // -------------------------------------------------------------------------
  // Sales + SaleItems
  //
  // A handful of realistic completed sales, one per shop, rung up by that
  // shop's cashier. Line totals / cost / profit are computed and stored as
  // point-in-time snapshots, matching the "price snapshot" comment in the
  // schema (spec §11 / §24).
  // -------------------------------------------------------------------------
  const TAX_RATE = 0.0; // adjust to your jurisdiction; kept simple for seed data

  const saleTemplates = [
    {
      invoiceNo: "INV-DT-0001",
      shop: "Downtown Store",
      cashierEmail: "cashier1.downtown@possystem.local",
      customerName: "Walk-in Customer",
      lines: [
        { sku: "BEV-001", qty: 3 },
        { sku: "SNK-001", qty: 2 },
        { sku: "HH-001", qty: 1 },
      ],
    },
    {
      invoiceNo: "INV-DT-0002",
      shop: "Downtown Store",
      cashierEmail: "cashier1.downtown@possystem.local",
      customerName: "Neema Kessy",
      customerEmail: "neema.kessy@example.com",
      lines: [
        { sku: "GRO-001", qty: 1 },
        { sku: "GRO-002", qty: 1 },
        { sku: "BEV-003", qty: 2 },
      ],
    },
    {
      invoiceNo: "INV-UP-0001",
      shop: "Uptown Branch",
      cashierEmail: "cashier1.uptown@possystem.local",
      customerName: "Walk-in Customer",
      lines: [
        { sku: "ELE-001", qty: 2 },
        { sku: "ELE-003", qty: 1 },
      ],
    },
    {
      invoiceNo: "INV-UP-0002",
      shop: "Uptown Branch",
      cashierEmail: "cashier1.uptown@possystem.local",
      customerName: "Daudi Mrema",
      customerEmail: "daudi.mrema@example.com",
      lines: [
        { sku: "SNK-002", qty: 4 },
        { sku: "SNK-003", qty: 2 },
        { sku: "HH-003", qty: 1 },
      ],
    },
  ] as const;

  let salesCreated = 0;
  for (const template of saleTemplates) {
    const existing = await prisma.sale.findUnique({ where: { invoiceNo: template.invoiceNo } });
    if (existing) continue;

    const shop = shopByName.get(template.shop)!;
    const cashier = userByEmail.get(template.cashierEmail)!;
    const employee = await prisma.employee.findUnique({ where: { userId: cashier.id } });

    const lineData = template.lines.map((line) => {
      const product = productBySku.get(line.sku)!;
      const unitPrice = Number(product.price);
      const unitCostPrice = Number(product.cost);
      const subtotal = round2(unitPrice * line.qty);
      const totalCost = round2(unitCostPrice * line.qty);
      const profit = round2(subtotal - totalCost);
      return {
        productId: product.id,
        quantity: line.qty,
        unitPrice,
        subtotal,
        unitCostPrice,
        totalCost,
        profit,
      };
    });

    const subtotal = round2(lineData.reduce((sum, l) => sum + l.subtotal, 0));
    const tax = round2(subtotal * TAX_RATE);
    const discount = 0;
    const total = round2(subtotal + tax - discount);
    const totalCost = round2(lineData.reduce((sum, l) => sum + l.totalCost, 0));
    const totalProfit = round2(total - totalCost);

    await prisma.sale.create({
      data: {
        invoiceNo: template.invoiceNo,
        employeeId: employee?.id,
        shopId: shop.id,
        customerName: template.customerName,
        customerEmail: "customerEmail" in template ? template.customerEmail : null,
        subtotal,
        tax,
        discount,
        total,
        totalCost,
        totalProfit,
        paymentMethod: "CASH",
        status: SaleStatus.COMPLETED,
        items: {
          create: lineData,
        },
      },
    });
    salesCreated++;
  }
  console.log(`✅ Sales created this run: ${salesCreated} (existing invoices left untouched)`);

  // -------------------------------------------------------------------------
  // Notifications for the admin
  // -------------------------------------------------------------------------
  const notificationSeeds = [
    {
      title: "Welcome to the POS system",
      message: "Your account has been set up. Explore the dashboard to get started.",
      type: "info",
    },
    {
      title: "Low stock alert",
      message: "Some products are approaching their minimum stock threshold.",
      type: "warning",
    },
  ];
  for (const n of notificationSeeds) {
    const existing = await prisma.notification.findFirst({
      where: { userId: adminUser.id, title: n.title },
    });
    if (!existing) {
      await prisma.notification.create({
        data: { userId: adminUser.id, title: n.title, message: n.message, type: n.type },
      });
    }
  }
  console.log(`✅ Notifications ensured for admin`);

  // -------------------------------------------------------------------------
  // System settings
  // -------------------------------------------------------------------------
  const systemSettings = [
    { key: "currency", value: "USD" },
    { key: "tax_rate", value: String(TAX_RATE) },
    { key: "store_timezone", value: "Africa/Dar_es_Salaam" },
  ];
  for (const s of systemSettings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }
  console.log(`✅ System settings: ${systemSettings.length}`);

  console.log("\n🌱 Seed complete.");
  console.log(`   Login for any seeded user: <email> / ${DEFAULT_PASSWORD}`);
  console.log(`   e.g. admin@possystem.local / ${DEFAULT_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
