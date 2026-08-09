# BUSINESS PLATFORM
## Product, Inventory, Sales, Analytics & Reporting System Design Specification

**Document Version:** 1.0  
**Status:** Implementation Specification  
**Target:** Next.js Full-Stack Business Management Platform  
**Primary Users:** Admin and Shop Employees  
**Database:** PostgreSQL  
**ORM:** Prisma  
**Frontend:** Next.js + React + TypeScript  
**UI:** Tailwind CSS + shadcn/ui  
**State/API:** Redux Toolkit + RTK Query where appropriate  
**Authentication:** Existing project authentication solution  
**Deployment Target:** Vercel / Supabase-compatible architecture

---

# 1. PURPOSE OF THIS DOCUMENT

This document defines the complete business logic and functional design for the Business Platform.

The system is designed for a business owner who operates multiple physical shops.

The business currently has:

- 1 Admin
- 3 Shops
- Employees assigned to shops
- Approximately 3 employees/users per shop
- Products distributed across shops
- Employees selling products from their assigned shops
- Employees recording daily sales
- Admin monitoring inventory, sales, revenue, profit/loss, employee performance, and business history

The system is **internal**.

It does **NOT** manage customers/buyers.

The system exists primarily to answer:

> What products do we have?

> Where is the stock?

> What has each shop sold?

> Who sold it?

> How much money was generated?

> How much did those products cost?

> How much profit was generated?

> Which products sell the most?

> Which shops perform best?

> Which products are running low?

> What happened historically?

---

# 2. CORE BUSINESS CONCEPT

The entire system must be designed around the following relationship:

```text
PRODUCT
   |
   | Stock is allocated to
   v
INVENTORY
   |
   | Employee sells from inventory
   v
SALE
   |
   +----> Inventory decreases
   |
   +----> Revenue generated
   |
   +----> Cost recorded
   |
   +----> Profit calculated
   |
   v
ANALYTICS
   |
   v
REPORTS
```

This is the central business flow.

Do NOT treat the system as a collection of unrelated CRUD modules.

Instead, treat it as a transactional business system.

---

# 3. VERY IMPORTANT DISTINCTION

## Product is NOT Inventory

A Product represents the business's master product definition.

Example:

```text
Product
--------------------------------
Name: Coca Cola 500ml
SKU: COKE-500
Category: Drinks
Cost Price: 800
Selling Price: 1,200
Minimum Stock: 10
```

This is one global product.

Inventory represents how many units of that product exist at a particular shop.

Example:

```text
Product: Coca Cola 500ml

Shop A -> 50 units
Shop B -> 30 units
Shop C -> 20 units
```

Therefore:

```text
PRODUCT
   |
   +---- SHOP A INVENTORY = 50
   |
   +---- SHOP B INVENTORY = 30
   |
   +---- SHOP C INVENTORY = 20
```

There is only ONE Coca Cola product record.

There are multiple inventory records.

---

# 4. CORE DOMAIN ENTITIES

The system should conceptually contain these major entities:

```text
User
Shop
Product
Category
Inventory
InventoryMovement
Sale
SaleItem
```

Optional/supporting entities may include:

```text
AuditLog
StockTransfer
Notification
```

depending on implementation requirements.

---

# 5. USER ROLES

There are two primary roles.

## ADMIN

The Admin has complete access to the business.

Admin can:

- Manage products
- Manage categories
- Manage shops
- Manage employees
- View all inventory
- Add stock
- Allocate stock
- Transfer stock
- Adjust stock
- View all sales
- View sales history
- View analytics
- View reports
- View shop performance
- View employee performance
- View profit/loss
- View inventory history
- Export reports
- Manage system configuration

---

## EMPLOYEE

An Employee belongs to exactly one shop.

Employee can:

- View available products
- View their shop inventory
- Record sales
- View their shop's sales history
- View their own recorded sales

Employee must NOT be able to:

- View another shop's inventory
- View another shop's sales
- Modify product master data
- Modify product prices
- Create products
- Delete products
- Transfer stock
- Modify business-wide analytics
- View confidential business-wide profit/loss unless explicitly allowed
- Manage employees
- Manage shops
- Access Admin functionality

---

# 6. SHOP STRUCTURE

Each employee must be associated with a shop.

Example:

```text
Shop A
 ├── Employee A1
 ├── Employee A2
 └── Employee A3

Shop B
 ├── Employee B1
 ├── Employee B2
 └── Employee B3

Shop C
 ├── Employee C1
 ├── Employee C2
 └── Employee C3
```

The shop relationship is critical because it determines:

- Which inventory the employee can access
- Which sales they can record
- Which sales they can see
- Which products they can sell
- Which inventory they can affect

---

# 7. ADMIN DASHBOARD NAVIGATION

Recommended Admin navigation:

```text
Dashboard

Products
Inventory
Sales
Analytics
Reports

Shops
Employees

Settings
```

Optional:

```text
Inventory Movements
Audit Logs
```

---

# 8. EMPLOYEE DASHBOARD NAVIGATION

Recommended Employee navigation:

```text
Dashboard

Products
Inventory
Record Sale
Sales History
```

The employee's entire dashboard must be scoped to their assigned shop.

---

# 9. PRODUCT MODULE

## Purpose

The Product module manages the global product catalog.

A product should contain information such as:

```text
id
name
sku
description
categoryId
costPrice
sellingPrice
minimumStockLevel
image
isActive
createdAt
updatedAt
```

Exact field naming can be adapted to the existing project conventions.

---

# 10. PRODUCT RULES

## Rule 1

Product is global across all shops.

Do not create separate product records for each shop.

Bad:

```text
Coca Cola Shop A
Coca Cola Shop B
Coca Cola Shop C
```

Correct:

```text
Product:
Coca Cola

Inventory:
Coca Cola + Shop A
Coca Cola + Shop B
Coca Cola + Shop C
```

---

## Rule 2

Products should be soft-deleted/archived rather than physically deleted if they have historical sales.

For example:

```text
isActive = false
```

A product with historical sales must remain available for historical reporting.

---

## Rule 3

Employees cannot change product pricing.

Product prices are controlled by Admin.

---

# 11. PRODUCT PRICE HISTORY

Historical sales must NEVER depend on the current Product price.

Example:

January:

```text
Cost Price = 800
Selling Price = 1,200
```

March:

```text
Cost Price = 1,000
Selling Price = 1,500
```

An old January sale must still show:

```text
Cost = 800
Selling = 1,200
```

even though the current Product record says:

```text
Cost = 1,000
Selling = 1,500
```

Therefore, the SaleItem must preserve price snapshots.

Recommended SaleItem financial fields:

```text
unitCostPrice
unitSellingPrice
quantity
totalCost
totalAmount
profit
```

---

# 12. INVENTORY MODULE

Inventory represents the current physical quantity of a product at a specific shop.

Conceptually:

```text
Inventory = Product + Shop + Quantity
```

Example:

```text
Product: Coca Cola
Shop: Shop A
Quantity: 50
```

Recommended conceptual fields:

```text
id
productId
shopId
quantity
createdAt
updatedAt
```

There should normally be only ONE inventory record for a given:

```text
productId + shopId
```

Use a unique database constraint for this combination.

---

# 13. INVENTORY EXAMPLE

Suppose:

```text
Product = Coca Cola
```

Inventory:

```text
Shop A = 50
Shop B = 30
Shop C = 20
```

Total business stock:

```text
50 + 30 + 20 = 100
```

The Product page can show:

```text
Total Stock: 100
```

while the Inventory page can show:

```text
Shop A: 50
Shop B: 30
Shop C: 20
```

---

# 14. INVENTORY STATUS

Inventory status should be derived from quantity and minimum stock level.

Example:

```text
quantity > minimumStockLevel
    -> HEALTHY

quantity <= minimumStockLevel
    -> LOW STOCK

quantity = 0
    -> OUT OF STOCK
```

Example:

```text
Minimum Stock: 10

Quantity: 50
Status: HEALTHY

Quantity: 7
Status: LOW STOCK

Quantity: 0
Status: OUT OF STOCK
```

Do not allow employees to manually change the status.

The status is derived.

---

# 15. STOCK ENTERING THE SYSTEM

The Admin must have a controlled operation for adding stock.

Example:

```text
Stock Received

Product:
Coca Cola

Quantity:
100
```

Then the Admin can allocate it:

```text
Shop A -> 40
Shop B -> 35
Shop C -> 25
```

Result:

```text
Shop A inventory +40
Shop B inventory +35
Shop C inventory +25
```

The total allocated quantity must not exceed the received quantity.

---

# 16. STOCK ALLOCATION

When allocating stock:

```text
Received Quantity = 100

Shop A = 40
Shop B = 35
Shop C = 25

Total Allocated = 100
```

Valid.

But:

```text
Shop A = 50
Shop B = 40
Shop C = 30

Total = 120
```

Invalid.

The system must reject this operation.

---

# 17. INVENTORY MOVEMENTS

The system should maintain a history of every inventory quantity change.

Do not rely only on the current quantity.

Example:

```text
Inventory:
Coca Cola
Shop A
Current Quantity = 47
```

Movement history:

```text
Date       Type             Quantity
--------------------------------------
Aug 01     STOCK_IN          +50
Aug 02     SALE               -3
Aug 03     STOCK_IN          +20
Aug 04     SALE              -10
Aug 05     ADJUSTMENT         -10
```

The system should be able to explain why the current quantity exists.

---

# 18. INVENTORY MOVEMENT TYPES

Recommended movement types:

```text
STOCK_IN
SALE
TRANSFER_IN
TRANSFER_OUT
ADJUSTMENT
RETURN
```

If some operations are not required for MVP, they can be disabled until needed.

---

# 19. INVENTORY MOVEMENT RECORD

Conceptually:

```text
InventoryMovement

id
inventoryId
type
quantity
reason
referenceId
performedBy
createdAt
```

Quantity convention:

```text
Positive = stock entering inventory

Negative = stock leaving inventory
```

Example:

```text
SALE
quantity = -3
```

or, alternatively, store absolute quantity and use movement type to determine direction.

Choose one consistent approach and use it everywhere.

---

# 20. STOCK TRANSFER

If the business eventually needs stock transfer between shops:

```text
Shop A
   |
   | Transfer 10
   v
Shop B
```

This must create two movements:

```text
Shop A
TRANSFER_OUT
-10

Shop B
TRANSFER_IN
+10
```

Both operations must occur atomically.

Do not decrease Shop A without increasing Shop B.

---

# 21. EMPLOYEE INVENTORY ACCESS

An employee can only access:

```text
Inventory.shopId === currentUser.shopId
```

Never trust a shop ID sent by the frontend.

The backend must determine the employee's shop from the authenticated user.

Bad:

```text
GET /inventory?shopId=shop-b
```

and blindly return Shop B.

Correct:

```text
currentUser.shopId
```

must be used for authorization.

---

# 22. SALE MODULE

A Sale represents a business transaction.

A sale must belong to:

```text
Shop
Employee/User
Date/Time
```

A sale can contain one or more SaleItems.

Conceptually:

```text
Sale
 |
 +--- SaleItem
 |
 +--- SaleItem
 |
 +--- SaleItem
```

Example:

```text
Sale #1001

Shop: Shop A
Employee: John

Items:
Coca Cola x3
Fanta x2
Sprite x1
```

---

# 23. SALE DATA

Recommended Sale fields:

```text
id
shopId
employeeId
totalAmount
totalCost
totalProfit
status
createdAt
updatedAt
```

Recommended status:

```text
COMPLETED
VOIDED
```

Additional statuses may be introduced if required.

---

# 24. SALE ITEM DATA

Recommended SaleItem fields:

```text
id
saleId
productId
quantity

unitCostPrice
unitSellingPrice

totalCost
totalAmount
profit
```

Calculations:

```text
totalAmount =
    quantity × unitSellingPrice

totalCost =
    quantity × unitCostPrice

profit =
    totalAmount - totalCost
```

---

# 25. RECORD SALE WORKFLOW

Employee opens:

```text
Record Sale
```

Employee selects:

```text
Product:
Coca Cola 500ml
```

The system loads:

```text
Selling Price:
TSh 1,200

Available Stock:
50
```

Employee enters:

```text
Quantity:
3
```

System calculates:

```text
Total:
TSh 3,600
```

Employee submits.

---

# 26. SALE VALIDATION

Before creating a sale, backend must verify:

1. User is authenticated.
2. User is an employee.
3. User belongs to a shop.
4. Product exists.
5. Product is active.
6. Product is available in the employee's shop.
7. Inventory record exists.
8. Requested quantity is greater than zero.
9. Requested quantity is not greater than available stock.
10. Current selling price/cost price can be resolved.
11. All required financial values are valid.

Example:

```text
Available Stock = 5
Requested Quantity = 7
```

Reject:

```text
Insufficient stock.
Available: 5
Requested: 7
```

---

# 27. SALE CREATION MUST BE ATOMIC

Creating a sale is NOT just:

```text
INSERT sale
```

It is a business transaction.

The operation should conceptually be:

```text
BEGIN TRANSACTION

1. Verify inventory
2. Lock/check inventory
3. Create Sale
4. Create SaleItems
5. Decrease inventory
6. Create InventoryMovement
7. Commit transaction
```

If any step fails:

```text
ROLLBACK
```

Nothing should partially remain.

---

# 28. SALE TRANSACTION EXAMPLE

Initial state:

```text
Coca Cola
Shop A
Stock = 50
```

Employee sells:

```text
Quantity = 3
Unit Selling Price = 1,200
Unit Cost = 800
```

Calculate:

```text
Revenue:
3 × 1,200 = 3,600

Cost:
3 × 800 = 2,400

Profit:
3,600 - 2,400 = 1,200
```

Inventory:

```text
50 - 3 = 47
```

Movement:

```text
SALE
-3
```

Everything is committed together.

---

# 29. CONCURRENCY / DOUBLE SELLING

The backend must account for concurrent requests.

Example:

```text
Stock = 5
```

Two employees/processes attempt:

```text
Employee A sells 4
Employee B sells 3
```

The system must NOT allow:

```text
5 - 4 - 3 = -2
```

Inventory cannot become negative unless the business explicitly allows negative stock.

Use proper database transaction/locking/concurrency handling supported by PostgreSQL/Prisma.

---

# 30. NEGATIVE INVENTORY

Default business rule:

```text
Inventory quantity cannot be negative.
```

Therefore:

```text
quantity < requestedQuantity
```

must reject the sale.

---

# 31. SALES HISTORY

Employees should have:

```text
Sales History
```

but only for their authorized scope.

Recommended employee view:

```text
Date
Product
Quantity
Unit Price
Total
Status
```

Depending on business requirements, employee sales history can show:

- Their own sales only
- Or all sales from their shop

Default recommendation:

> Show shop sales history, but clearly identify the employee who made each sale.

If the business wants stricter privacy, show only the current employee's sales.

---

# 32. ADMIN SALES VIEW

Admin can view all sales.

Filters:

```text
Shop
Employee
Product
Category
Date Range
Status
```

Example:

```text
Sales

Date       Shop      Employee    Product       Qty    Total
--------------------------------------------------------------
Aug 09     Shop A    John        Coca Cola      3     3,600
Aug 09     Shop B    Peter       Fanta          5     6,000
Aug 08     Shop C    Mary        Sprite         8     9,600
```

---

# 33. SALE DETAILS

Clicking a sale should show:

```text
Sale #SALE-001

Shop:
Shop A

Employee:
John

Date:
09 Aug 2026 14:32

Items:
-----------------------------------------
Product        Qty    Price      Total
Coca Cola       3    1,200       3,600
Fanta           2    1,200       2,400
-----------------------------------------

Revenue:
TSh 6,000

Cost:
TSh 4,000

Profit:
TSh 2,000

Status:
COMPLETED
```

---

# 34. SALES SHOULD BE HISTORICAL RECORDS

Once a sale has been completed, do not casually mutate its financial values.

If an error occurs, use a controlled correction/void process.

For example:

```text
Sale #1001
Status: COMPLETED
```

If the admin determines it was incorrect:

```text
VOID SALE
```

This should:

1. Mark original sale as VOIDED.
2. Create the required inventory reversal.
3. Create an audit record.
4. Preserve the original sale.

Do not simply delete the sale.

---

# 35. SALE VOIDING

Example:

Original sale:

```text
Coca Cola x3
```

Inventory changed:

```text
50 -> 47
```

When voided:

```text
47 -> 50
```

Create inventory movement:

```text
SALE_REVERSAL
+3
```

The original sale remains in history:

```text
SALE #1001
Status: VOIDED
```

This preserves accountability.

---

# 36. ADMIN DASHBOARD

The main Admin Dashboard should provide a quick overview.

Recommended KPI cards:

```text
Today's Revenue
Today's Profit
Units Sold
Total Inventory Value
Low Stock Products
```

Additional:

```text
Total Products
Total Shops
Active Employees
```

---

# 37. ADMIN DASHBOARD SALES SUMMARY

Show:

```text
Sales Overview
```

with selectable period:

```text
Today
This Week
This Month
This Year
Custom Range
```

Metrics:

```text
Revenue
Cost
Profit
Units Sold
Number of Sales
```

---

# 38. ADMIN DASHBOARD SHOP PERFORMANCE

Example:

```text
Shop Performance

Shop A
Revenue: TSh 1,200,000
Profit:  TSh   400,000
Units:   1,050

Shop B
Revenue: TSh 950,000
Profit:  TSh 310,000
Units:   800

Shop C
Revenue: TSh 1,400,000
Profit:  TSh 470,000
Units:   1,200
```

---

# 39. ANALYTICS MODULE

Analytics should answer business questions.

It should NOT require manual data entry.

Analytics are derived from transactional data.

Primary sources:

```text
Sales
SaleItems
Inventory
InventoryMovements
Products
Shops
Users
```

---

# 40. ANALYTICS METRICS

Recommended metrics:

## Revenue

```text
SUM(Sale.totalAmount)
```

for valid/completed sales in the selected period.

---

## Cost

```text
SUM(Sale.totalCost)
```

for valid/completed sales.

---

## Gross Profit

```text
Revenue - Cost
```

or:

```text
SUM(Sale.totalProfit)
```

---

## Units Sold

```text
SUM(SaleItem.quantity)
```

---

## Number of Sales

```text
COUNT(Sale)
```

---

# 41. BEST-SELLING PRODUCTS

Analytics should support:

```text
Top Products by Units Sold
```

Example:

```text
1. Coca Cola     520 units
2. Fanta         430 units
3. Sprite        390 units
```

Can also support:

```text
Top Products by Revenue
Top Products by Profit
```

These are different metrics.

---

# 42. TOP PRODUCTS BY REVENUE

Example:

```text
Product        Revenue
--------------------------
Product A      1,500,000
Product B      1,200,000
Product C        900,000
```

---

# 43. TOP PRODUCTS BY PROFIT

Example:

```text
Product        Profit
------------------------
Product A      450,000
Product C      400,000
Product B      250,000
```

The best-selling product is not necessarily the most profitable.

The system should support both.

---

# 44. SHOP ANALYTICS

Admin can compare shops:

```text
Shop
Revenue
Cost
Profit
Units Sold
Number of Sales
```

Example:

```text
Shop A
Revenue = 1.2M
Profit = 400K

Shop B
Revenue = 900K
Profit = 300K

Shop C
Revenue = 1.4M
Profit = 470K
```

---

# 45. EMPLOYEE ANALYTICS

Admin can optionally see:

```text
Employee
Shop
Sales Count
Units Sold
Revenue
Profit
```

Example:

```text
John
Shop A
Sales: 45
Units: 120
Revenue: 144,000
Profit: 48,000
```

This allows the owner to understand employee performance.

---

# 46. INVENTORY ANALYTICS

Admin should be able to see:

```text
Total Products
Total Units
Low Stock
Out of Stock
Inventory by Shop
```

Example:

```text
Shop A
Healthy: 45
Low: 8
Out of Stock: 2
```

---

# 47. REPORTS MODULE

Reports are detailed business summaries.

Analytics answers:

> How is the business doing?

Reports answer:

> What exactly happened?

---

# 48. REQUIRED REPORT TYPES

Recommended initial reports:

```text
1. Sales Report
2. Inventory Report
3. Profit/Loss Report
4. Product Performance Report
5. Shop Performance Report
6. Employee Sales Report
7. Inventory Movement Report
```

---

# 49. SALES REPORT

Filters:

```text
Date Range
Shop
Employee
Product
Category
Status
```

Output:

```text
Sales Report

Product
Shop
Employee
Quantity
Revenue
Cost
Profit
Date
```

Summary:

```text
Total Revenue
Total Cost
Total Profit
Total Units
Total Transactions
```

---

# 50. INVENTORY REPORT

Example:

```text
Product        Shop A    Shop B    Shop C    Total
----------------------------------------------------
Coca Cola       50        30        20       100
Fanta            4        20        10        34
Sprite          20        15        30        65
```

Include:

```text
Current Stock
Minimum Stock
Status
```

---

# 51. PROFIT/LOSS REPORT

For this MVP, distinguish between:

## Revenue

Money generated from completed sales.

## Cost of Goods Sold

The recorded cost of products sold.

## Gross Profit

```text
Revenue - Cost of Goods Sold
```

Do not call this "net profit" unless operating expenses are also implemented.

If the system does not track:

- Rent
- Salaries
- Electricity
- Transport
- Taxes
- Other expenses

then the report should use:

```text
Gross Profit
```

rather than:

```text
Net Profit
```

---

# 52. REPORT DATE FILTERS

All major reports should support:

```text
Today
Yesterday
This Week
This Month
Last Month
This Year
Custom Range
```

Custom range:

```text
From: [date]
To:   [date]
```

Backend must perform date filtering consistently.

---

# 53. REPORT EXPORT

Reports should eventually support:

```text
Export CSV
Export Excel
Export PDF
```

Do not implement all export formats before the underlying report queries are correct.

Priority:

```text
1. Correct database query
2. Correct UI table
3. Filtering
4. Summary calculations
5. Export
```

---

# 54. EMPLOYEE DASHBOARD

Employee dashboard should be intentionally simple.

Recommended:

```text
Today's Sales
Today's Revenue
Units Sold
Current Shop Stock Alerts
```

Example:

```text
Welcome, John

Today's Sales
12

Today's Revenue
TSh 48,000

Units Sold
38

Low Stock
3 products
```

The employee should not be overwhelmed by business-wide analytics.

---

# 55. EMPLOYEE PRODUCTS PAGE

Show products available to their shop.

Example:

```text
Product             Price       Stock       Status
---------------------------------------------------
Coca Cola           1,200        50         In Stock
Fanta               1,200         4         Low Stock
Sprite              1,200        20         In Stock
```

Employee cannot edit these values.

---

# 56. EMPLOYEE INVENTORY PAGE

Show:

```text
Current Shop
Current Stock
Product
Minimum Stock
Status
```

Employee should not be able to:

```text
+ Add stock
- Remove stock
Change prices
Transfer stock
Change minimum stock
```

unless explicitly authorized by Admin.

---

# 57. EMPLOYEE RECORD SALE PAGE

Recommended form:

```text
Record Sale

Product
[ Select Product ]

Available Stock
50

Unit Price
TSh 1,200

Quantity
[ 3 ]

Total
TSh 3,600

[ Record Sale ]
```

The form should update totals dynamically.

But all final validation must happen on the backend.

Never trust frontend calculations.

---

# 58. EMPLOYEE SALE VALIDATION

Frontend validation improves UX.

Backend validation provides security and correctness.

Both are required.

Frontend:

```text
Quantity must be > 0
```

Backend:

```text
Quantity > 0
AND
Quantity <= current inventory
AND
employee.shopId === inventory.shopId
```

---

# 59. ROLE-BASED ACCESS CONTROL

Every protected operation must be authorized on the backend.

Do not rely on hiding sidebar links.

For example, hiding:

```text
Admin → Products
```

from an employee is NOT sufficient.

The API must also reject:

```text
Employee -> POST /products
```

---

# 60. SHOP-BASED AUTHORIZATION

For employee operations:

```text
currentUser.shopId
```

must be used as the source of truth.

Example:

Employee belongs to Shop A.

Employee sends:

```text
shopId = Shop C
```

Backend must ignore/reject it.

The employee cannot choose another shop.

---

# 61. BUSINESS DATA OWNERSHIP

Use this conceptual authorization matrix:

| Resource | Admin | Employee |
|---|---|---|
| Products | All | Read |
| Categories | All | Read |
| Shops | All | Assigned shop only |
| Inventory | All | Assigned shop |
| Inventory Movement | All | Assigned shop/read as appropriate |
| Sales | All | Assigned shop / own sales |
| Analytics | All | Limited shop summary |
| Reports | All | Limited/none |
| Employees | All | None |
| Settings | All | Personal settings |

---

# 62. DATA CONSISTENCY RULES

The following must always remain true.

## Rule A

Inventory quantity cannot normally be negative.

---

## Rule B

A sale cannot exceed available stock.

---

## Rule C

Every completed sale must have at least one SaleItem.

---

## Rule D

Every SaleItem must reference a valid Product.

---

## Rule E

Every Sale must belong to a Shop.

---

## Rule F

Every employee-created Sale must belong to the employee's Shop.

---

## Rule G

Sale financial snapshots must not change when Product prices change.

---

## Rule H

Inventory changes caused by sales must create inventory movement history.

---

## Rule I

Analytics must exclude VOIDED sales.

---

## Rule J

Historical records should not be physically deleted when doing so would destroy business history.

---

# 63. DATABASE TRANSACTION REQUIREMENTS

The following operations should use database transactions.

## Sale Creation

```text
BEGIN

Validate inventory
Create sale
Create sale items
Decrease inventory
Create inventory movement

COMMIT
```

---

## Stock Allocation

```text
BEGIN

Create/update inventory
Create inventory movements

COMMIT
```

---

## Stock Transfer

```text
BEGIN

Decrease source inventory
Increase destination inventory
Create TRANSFER_OUT
Create TRANSFER_IN

COMMIT
```

---

## Sale Void

```text
BEGIN

Mark sale VOIDED
Restore inventory
Create reversal movement
Create audit record

COMMIT
```

---

# 64. CURRENT INVENTORY VS INVENTORY HISTORY

These are two different concepts.

Current inventory:

```text
Inventory.quantity
```

History:

```text
InventoryMovement
```

Example:

```text
Inventory
---------
Current = 47
```

History:

```text
+50 STOCK_IN
-3  SALE
```

The current quantity is optimized for fast access.

The movement history is optimized for traceability.

---

# 65. AUDITABILITY

Important administrative operations should be auditable.

Potential audit events:

```text
PRODUCT_CREATED
PRODUCT_UPDATED
PRODUCT_ARCHIVED

STOCK_ADDED
STOCK_ADJUSTED
STOCK_TRANSFERRED

SALE_CREATED
SALE_VOIDED

EMPLOYEE_CREATED
EMPLOYEE_UPDATED
EMPLOYEE_DEACTIVATED
```

Audit information should include:

```text
who
what
when
resource
resourceId
details
```

---

# 66. DASHBOARD FILTER DESIGN

Analytics and reports should use consistent filters.

Recommended shared filter structure:

```text
Date Range
Shop
Product
Category
Employee
```

Not every screen needs every filter.

For example:

Sales:

```text
Date
Shop
Employee
Product
```

Inventory:

```text
Shop
Product
Category
```

Analytics:

```text
Date
Shop
```

---

# 67. SEARCH

Products should support:

```text
Search by name
Search by SKU
```

Sales can support:

```text
Sale ID
Product
Employee
Shop
```

Inventory:

```text
Product
SKU
Shop
```

---

# 68. PAGINATION

Do not load thousands of sales at once.

Use server-side pagination.

Example:

```text
GET /sales?page=1&limit=20
```

The exact API structure should follow the existing application architecture.

---

# 69. API DESIGN PRINCIPLE

The frontend should not contain business-critical logic.

Bad:

```text
Frontend:
stock = stock - quantity
```

and assume success.

Correct:

```text
Frontend
   |
   | Record Sale
   v
Backend
   |
   | Validate
   | Transaction
   | Update inventory
   | Create movement
   v
Database
   |
   v
Response
```

Frontend then refreshes/updates its state from the server response.

---

# 70. RECOMMENDED API AREAS

Exact route naming can follow existing conventions, but conceptually:

```text
/products
/products/:id

/inventory
/inventory/:id
/inventory/movements

/stock
/stock/allocate
/stock/transfer
/stock/adjust

/sales
/sales/:id
/sales/:id/void

/analytics
/analytics/overview
/analytics/products
/analytics/shops
/analytics/employees

/reports
/reports/sales
/reports/inventory
/reports/profit
/reports/products
/reports/shops
/reports/employees
```

---

# 71. FRONTEND ARCHITECTURE

Use a feature-oriented structure rather than putting everything into generic folders.

Conceptually:

```text
src/
├── app/
├── components/
├── features/
│   ├── products/
│   ├── inventory/
│   ├── sales/
│   ├── analytics/
│   ├── reports/
│   ├── shops/
│   └── employees/
├── lib/
├── services/
├── store/
└── types/
```

Adapt this to the existing project structure rather than blindly replacing it.

---

# 72. UI DESIGN PRINCIPLES

Use:

- shadcn/ui
- Tailwind CSS
- Responsive layouts
- Consistent spacing
- Clear data tables
- Cards for KPI metrics
- Dialogs/sheets for small actions
- Confirmation dialogs for destructive actions
- Toast notifications
- Loading states
- Empty states
- Error states
- Skeleton loading where useful

Avoid unnecessary visual complexity.

The Admin dashboard should feel like a professional business management system.

---

# 73. PRODUCT PAGE UI

Recommended:

```text
Products

[ Search products ] [ Category ] [ Add Product ]

-----------------------------------------------------

Product     SKU       Cost     Price     Stock     Status
-----------------------------------------------------
Coca Cola   COKE500   800      1,200     100       Active
Fanta       FANTA500  800      1,200      34       Active
```

Actions:

```text
View
Edit
Archive
```

---

# 74. INVENTORY PAGE UI

Recommended:

```text
Inventory

[ All Shops ] [ Search ] [ Status ]

----------------------------------------------------
Product      Shop      Stock      Min     Status
----------------------------------------------------
Coca Cola    Shop A     50        10     Healthy
Coca Cola    Shop B     30        10     Healthy
Fanta        Shop A      4        10     Low
```

Actions for Admin:

```text
Add Stock
Adjust
Transfer
View History
```

---

# 75. SALES PAGE UI

Recommended:

```text
Sales

[ Date ] [ Shop ] [ Employee ] [ Product ]

----------------------------------------------------
Sale ID      Shop      Employee     Total     Status
----------------------------------------------------
SALE-001     Shop A    John         3,600     Completed
SALE-002     Shop B    Peter        6,000     Completed
```

---

# 76. ANALYTICS UI

Recommended sections:

```text
Overview
    KPI cards

Revenue Chart

Profit Chart

Sales by Shop

Top Products

Low Stock

Employee Performance
```

Avoid putting every chart on one screen if it harms usability.

---

# 77. REPORT UI

Reports should be table-oriented.

Example:

```text
Sales Report

[Date Range]
[Shop]
[Employee]
[Product]

[Generate Report] [Export]

------------------------------------------------
...
```

Summary cards above the table:

```text
Revenue
Cost
Profit
Units
Transactions
```

---

# 78. ERROR HANDLING

Important business errors should be understandable.

Bad:

```text
Error 500
```

Better:

```text
Unable to record sale.
The requested quantity is greater than available stock.

Available stock: 5
Requested quantity: 8
```

Other examples:

```text
Product is inactive.
```

```text
This product is not available in your shop.
```

```text
You are not authorized to perform this action.
```

```text
The sale could not be completed. No inventory was changed.
```

---

# 79. LOADING STATES

Every asynchronous operation needs appropriate feedback.

Examples:

```text
Loading products...
Loading inventory...
Loading sales...
Generating report...
Recording sale...
Updating inventory...
```

Buttons should prevent duplicate submissions while a mutation is running.

Example:

```text
[ Recording Sale... ]
```

instead of allowing multiple clicks.

---

# 80. EMPTY STATES

Examples:

No products:

```text
No products found.

Create your first product to get started.
```

No sales:

```text
No sales recorded yet.
```

No inventory:

```text
This shop currently has no inventory.
```

No reports:

```text
No data available for the selected period.
```

---

# 81. SECURITY REQUIREMENTS

The implementation must enforce:

- Authentication
- Role-based authorization
- Shop-based authorization
- Server-side validation
- Input validation
- Database constraints
- Transactional operations
- Protection against unauthorized record access

Never trust:

```text
shopId
employeeId
userId
prices
inventory quantity
profit
```

sent by the frontend.

The backend must determine authoritative values.

---

# 82. FINANCIAL DATA SECURITY

Do not allow the frontend to submit:

```text
profit = 500000
```

and blindly save it.

The backend calculates:

```text
totalAmount
totalCost
profit
```

from trusted product/inventory/pricing information.

---

# 83. PRICE SECURITY

At sale creation:

```text
Product current selling price
Product current cost price
```

are resolved by the backend.

Then copied into SaleItem:

```text
unitSellingPrice
unitCostPrice
```

The client can display the price, but the backend remains authoritative.

---

# 84. ANALYTICS DATA RULE

Completed sales:

```text
INCLUDE
```

Voided sales:

```text
EXCLUDE
```

unless specifically generating a report about voided transactions.

---

# 85. PROFIT DATA RULE

For each SaleItem:

```text
Revenue =
quantity × unitSellingPrice

Cost =
quantity × unitCostPrice

Profit =
Revenue - Cost
```

For the sale:

```text
Sale.totalAmount =
SUM(SaleItem.totalAmount)

Sale.totalCost =
SUM(SaleItem.totalCost)

Sale.totalProfit =
SUM(SaleItem.profit)
```

---

# 86. IMPORTANT TERMINOLOGY

Use consistent terminology throughout the system.

### Product

The master catalog item.

### Inventory

Current stock of a product at a shop.

### Inventory Movement

A record explaining why inventory changed.

### Sale

A transaction made by an employee.

### SaleItem

A product/quantity inside a sale.

### Revenue

Money generated from sales.

### Cost

Cost of products sold.

### Gross Profit

Revenue minus cost of goods sold.

### Report

Detailed business information generated from underlying data.

### Analytics

Aggregated insights derived from business data.

---

# 87. DO NOT IMPLEMENT THESE AS INDEPENDENT MANUAL NUMBERS

Do not create manual fields like:

```text
dashboardRevenue
dashboardProfit
analyticsRevenue
reportRevenue
```

unless there is a deliberate caching/materialized-view architecture.

The source of truth is:

```text
Sales
SaleItems
Inventory
InventoryMovements
Products
Shops
Users
```

Analytics and reports derive from these.

---

# 88. SOURCE OF TRUTH

The system should conceptually follow:

```text
PRODUCT
    ↓
INVENTORY
    ↓
SALE
    ↓
SALE ITEM
    ↓
ANALYTICS / REPORTS
```

Inventory history:

```text
INVENTORY
    ↓
INVENTORY MOVEMENTS
```

---

# 89. COMPLETE BUSINESS FLOW

## FLOW A — Product Creation

```text
Admin
 ↓
Products
 ↓
Create Product
 ↓
Enter:
  Name
  SKU
  Category
  Cost Price
  Selling Price
  Minimum Stock
 ↓
Validate
 ↓
Save Product
```

---

# 90. FLOW B — Stock Distribution

```text
Admin
 ↓
Inventory
 ↓
Add Stock
 ↓
Select Product
 ↓
Enter Total Quantity
 ↓
Allocate to Shops
 ↓
Validate Allocation
 ↓
Database Transaction
 ↓
Update Inventory
 ↓
Create Inventory Movements
 ↓
Success
```

---

# 91. FLOW C — Employee Views Inventory

```text
Employee Login
 ↓
Authenticated User
 ↓
Determine User.shopId
 ↓
Query Inventory
WHERE shopId = currentUser.shopId
 ↓
Display inventory
```

Never allow the frontend to override the shop scope.

---

# 92. FLOW D — Employee Records Sale

```text
Employee
 ↓
Record Sale
 ↓
Select Product
 ↓
Backend determines shop
 ↓
Backend checks inventory
 ↓
Backend gets current price
 ↓
Employee enters quantity
 ↓
Backend validates quantity
 ↓
BEGIN TRANSACTION
 ↓
Create Sale
 ↓
Create SaleItem
 ↓
Decrease Inventory
 ↓
Create InventoryMovement
 ↓
COMMIT
 ↓
Return Sale
 ↓
Refresh Inventory/Sales
```

---

# 93. FLOW E — Admin Views Analytics

```text
Admin
 ↓
Analytics
 ↓
Select date/shop filters
 ↓
Backend queries sales/inventory data
 ↓
Aggregate
 ↓
Revenue
Cost
Profit
Units
Top Products
Shop Performance
 ↓
Return analytics
 ↓
Display charts/cards/tables
```

---

# 94. FLOW F — Admin Generates Report

```text
Admin
 ↓
Reports
 ↓
Select Report Type
 ↓
Select Filters
 ↓
Generate
 ↓
Backend queries authoritative data
 ↓
Calculate summaries
 ↓
Return report
 ↓
Display table
 ↓
Optional Export
```

---

# 95. COMPLETE EXAMPLE

Assume:

```text
Product:
Coca Cola 500ml

Cost:
800

Selling:
1,200
```

Admin allocates:

```text
Shop A = 50
Shop B = 30
Shop C = 20
```

Shop A inventory:

```text
50
```

Employee John at Shop A sells:

```text
3 Coca Cola
```

Sale:

```text
Quantity = 3
Unit Selling = 1,200
Unit Cost = 800

Revenue = 3,600
Cost = 2,400
Profit = 1,200
```

Inventory:

```text
50 - 3 = 47
```

Movement:

```text
SALE
-3
```

Analytics now sees:

```text
Revenue +3,600
Cost +2,400
Profit +1,200
Units Sold +3
```

Inventory analytics sees:

```text
Shop A Coca Cola = 47
```

Sales history shows:

```text
Coca Cola
3 units
TSh 3,600
John
Shop A
```

---

# 96. WHAT HAPPENS WHEN PRICE CHANGES?

Current Product:

```text
Cost = 1,000
Selling = 1,500
```

New sale:

```text
Quantity = 2

Revenue = 3,000
Cost = 2,000
Profit = 1,000
```

Old sale remains:

```text
Quantity = 3

Revenue = 3,600
Cost = 2,400
Profit = 1,200
```

Do NOT recalculate old sales using the new prices.

---

# 97. WHAT HAPPENS WHEN A PRODUCT IS ARCHIVED?

Suppose Coca Cola is discontinued.

Admin archives:

```text
Product.isActive = false
```

The product:

- Cannot normally be sold
- Cannot be selected for new sales
- Remains visible in historical sales
- Remains available for reports
- Remains associated with old inventory history

---

# 98. WHAT HAPPENS WHEN INVENTORY REACHES ZERO?

Example:

```text
Stock = 3
Employee sells 3
```

Result:

```text
Stock = 0
Status = OUT OF STOCK
```

Employee cannot record another sale for that product.

---

# 99. WHAT HAPPENS WHEN STOCK IS LOW?

Example:

```text
Minimum = 10
Current = 7
```

Status:

```text
LOW STOCK
```

Admin dashboard should surface this.

Example:

```text
Low Stock Alert

Fanta 500ml
Shop A
7 units remaining
Minimum: 10
```

---

# 100. WHAT HAPPENS WHEN A SALE FAILS?

Suppose:

```text
Stock = 5
Employee requests = 10
```

The operation must fail.

Result:

```text
Sale not created.
Inventory remains 5.
No inventory movement is created.
```

No partial state.

---

# 101. WHAT HAPPENS WHEN DATABASE FAILURE OCCURS?

If:

```text
Sale created
```

but:

```text
Inventory update fails
```

the transaction must roll back.

Final state:

```text
No sale
No inventory change
No movement
```

The business data remains consistent.

---

# 102. IMPLEMENTATION PRIORITY

Build in this order.

## PHASE 1 — Foundation

Implement:

```text
Authentication
Roles
Users
Shops
```

---

## PHASE 2 — Products

Implement:

```text
Categories
Products
Product CRUD
Product archive
Pricing
```

---

## PHASE 3 — Inventory

Implement:

```text
Inventory
Stock In
Stock Allocation
Inventory Movement
Low Stock
Out of Stock
```

---

## PHASE 4 — Sales

Implement:

```text
Record Sale
Sale
SaleItem
Inventory deduction
Inventory movement
Sale history
```

This is the most important transactional phase.

---

## PHASE 5 — Admin Sales

Implement:

```text
All sales
Filters
Sale details
Sale status
Void sale
```

---

## PHASE 6 — Analytics

Implement:

```text
Revenue
Cost
Profit
Units Sold
Top Products
Shop Performance
Employee Performance
Inventory Analytics
```

---

## PHASE 7 — Reports

Implement:

```text
Sales Report
Inventory Report
Profit Report
Product Report
Shop Report
Employee Report
Movement Report
```

---

## PHASE 8 — Export

Implement:

```text
CSV
Excel
PDF
```

after report queries are verified.

---

# 103. TESTING REQUIREMENTS

Do not consider the feature complete just because the UI works.

Test business rules.

## Product Tests

```text
Create product
Duplicate SKU
Update product
Archive product
```

## Inventory Tests

```text
Add stock
Allocate stock
Prevent over-allocation
Low stock
Out of stock
Inventory history
```

## Sale Tests

```text
Successful sale
Zero quantity
Negative quantity
Insufficient stock
Inactive product
Wrong shop
Inventory deduction
Profit calculation
Sale history
```

## Transaction Tests

```text
Sale creation + inventory update
Failure rollback
Concurrent sales
```

## Authorization Tests

```text
Employee cannot create product
Employee cannot edit product
Employee cannot access Shop B
Employee cannot access Admin analytics
Employee cannot modify another employee's sale
```

---

# 104. IMPORTANT SECURITY TEST

Try this scenario:

Employee A belongs to:

```text
Shop A
```

Employee A sends:

```text
shopId = Shop B
```

The backend must NOT allow access to Shop B.

The backend should derive:

```text
shopId = currentUser.shopId
```

from authentication.

---

# 105. IMPORTANT FINANCIAL TEST

Product:

```text
Cost = 800
Selling = 1,200
```

Sale:

```text
Quantity = 10
```

Expected:

```text
Revenue = 12,000
Cost = 8,000
Profit = 4,000
```

Then change product:

```text
Cost = 1,000
Selling = 1,500
```

Old sale must STILL show:

```text
Revenue = 12,000
Cost = 8,000
Profit = 4,000
```

---

# 106. IMPORTANT INVENTORY TEST

Initial:

```text
Stock = 10
```

Sale:

```text
Quantity = 3
```

Expected:

```text
Stock = 7
```

Movement:

```text
SALE -3
```

Second sale:

```text
Quantity = 7
```

Expected:

```text
Stock = 0
```

Third sale:

```text
Quantity = 1
```

Expected:

```text
Rejected
Insufficient stock
```

---

# 107. IMPORTANT ANALYTICS TEST

Sales:

```text
Sale 1:
Revenue = 3,600
Cost = 2,400
Profit = 1,200

Sale 2:
Revenue = 6,000
Cost = 4,000
Profit = 2,000
```

Expected analytics:

```text
Revenue = 9,600
Cost = 6,400
Profit = 3,200
```

Do not calculate profit from current Product prices.

Use Sale/SaleItem snapshots.

---

# 108. DATABASE DESIGN PRINCIPLES

Use proper:

- Foreign keys
- Unique constraints
- Indexes
- Enum types where appropriate
- Decimal/numeric types for monetary values
- Transactions
- Timestamps
- Soft deletion/archive where historical data requires it

Avoid using floating-point numbers for money.

Prefer appropriate PostgreSQL `numeric/decimal` representation.

---

# 109. IMPORTANT INDEXES

Consider indexes for frequently queried fields such as:

```text
Product.sku
Product.categoryId

Inventory.productId
Inventory.shopId
Inventory(productId, shopId)

InventoryMovement.inventoryId
InventoryMovement.createdAt

Sale.shopId
Sale.employeeId
Sale.createdAt
Sale.status

SaleItem.saleId
SaleItem.productId
```

Exact indexes should be determined from actual query patterns.

---

# 110. MONETARY VALUES

Money must be handled accurately.

Do NOT use JavaScript floating-point arithmetic as the source of truth for financial persistence.

Use database Decimal/Numeric types and appropriate Prisma Decimal handling.

Examples:

```text
800
1200
3600
2400
1200
```

should remain exact.

---

# 111. DO NOT OVERENGINEER THE MVP

The initial business requirements are simple.

Do NOT introduce unnecessarily complex systems such as:

```text
microservices
event sourcing
Kafka
Elasticsearch
complex warehouse management
customer CRM
payment processing
```

unless a real requirement appears.

The system should initially be a clean full-stack Next.js application with PostgreSQL and Prisma.

---

# 112. DO NOT DUPLICATE BUSINESS LOGIC

Avoid having:

```text
Frontend profit calculation
Backend profit calculation
Analytics profit calculation
Report profit calculation
```

with different implementations.

Centralize business rules where practical.

For example:

```text
Sale calculation logic
Inventory validation logic
Authorization logic
```

should have clear authoritative implementations.

---

# 113. FRONTEND STATE MANAGEMENT

Use the existing project state architecture.

For server data:

```text
Products
Inventory
Sales
Analytics
Reports
```

prefer the existing RTK Query/data-fetching approach rather than manually duplicating server state.

Do not introduce React Query, Zustand, Axios, or another state/data layer if the project has already standardized on Redux Toolkit + RTK Query.

---

# 114. DO NOT REBUILD EXISTING PROJECT ARCHITECTURE

Before implementing:

1. Inspect the existing codebase.
2. Identify existing authentication.
3. Identify existing database schema.
4. Identify existing Prisma configuration.
5. Identify existing API/data fetching.
6. Identify existing UI components.
7. Reuse existing components and conventions.
8. Modify existing architecture only when necessary.

Do not blindly create a second architecture.

---

# 115. IMPLEMENTATION INSTRUCTION FOR AI CODING AGENT

You are implementing an existing Business Platform.

Before writing code:

```text
1. Inspect the repository.
2. Understand the current architecture.
3. Identify existing models.
4. Identify existing authentication.
5. Identify existing routes.
6. Identify existing components.
7. Identify existing state management.
8. Identify existing styling conventions.
9. Identify what has already been implemented.
```

Do NOT overwrite working features.

Do NOT create duplicate models.

Do NOT create duplicate API layers.

Do NOT replace the existing stack without a strong reason.

---

# 116. IMPLEMENTATION STRATEGY

Implement incrementally.

For each module:

```text
Database
 ↓
Server/business logic
 ↓
API
 ↓
Frontend data fetching
 ↓
UI
 ↓
Validation
 ↓
Authorization
 ↓
Tests
```

Do not build the entire frontend first and invent backend logic later.

---

# 117. RECOMMENDED DEVELOPMENT ORDER

Use this exact sequence unless the existing codebase requires another order:

```text
1. Inspect existing project

2. Confirm User + Role + Shop architecture

3. Implement Product domain

4. Implement Inventory domain

5. Implement InventoryMovement domain

6. Implement Stock operations

7. Implement Sale + SaleItem

8. Implement transactional sale creation

9. Implement Employee Sales History

10. Implement Admin Sales

11. Implement Analytics queries

12. Implement Reports

13. Implement exports

14. Improve UI/UX

15. Add comprehensive tests
```

---

# 118. DEFINITION OF DONE

A feature is not complete until:

```text
[ ] Database model exists
[ ] Database constraints exist
[ ] Server logic exists
[ ] Authorization exists
[ ] Validation exists
[ ] API exists
[ ] Frontend exists
[ ] Loading state exists
[ ] Error state exists
[ ] Empty state exists
[ ] Success feedback exists
[ ] Business transaction is atomic where required
[ ] Historical data remains correct
[ ] Tests cover important business rules
```

---

# 119. FINAL ARCHITECTURE

The finished business system should conceptually look like:

```text
                         ┌─────────────┐
                         │    ADMIN    │
                         └──────┬──────┘
                                │
               ┌────────────────┼─────────────────┐
               │                │                 │
               ▼                ▼                 ▼
           PRODUCTS         INVENTORY           SALES
               │                │                 │
               │                │                 │
               │                ▼                 │
               │       INVENTORY MOVEMENTS        │
               │                                  │
               └──────────────┬───────────────────┘
                              │
                              ▼
                         ANALYTICS
                              │
                              ▼
                           REPORTS
```

Employee flow:

```text
                    ┌─────────────┐
                    │  EMPLOYEE   │
                    └──────┬──────┘
                           │
             ┌─────────────┼──────────────┐
             │             │              │
             ▼             ▼              ▼
         PRODUCTS      INVENTORY      RECORD SALE
                                           │
                                           ▼
                                        SALE
                                           │
                                  ┌────────┴────────┐
                                  ▼                 ▼
                             INVENTORY          HISTORY
                              - quantity
```

---

# 120. MOST IMPORTANT BUSINESS FLOW

The most important operation in the entire application is:

```text
Employee Records Sale
        │
        ▼
Validate Employee
        │
        ▼
Determine Employee Shop
        │
        ▼
Validate Product
        │
        ▼
Check Inventory
        │
        ▼
Get Trusted Product Prices
        │
        ▼
Calculate Financial Values
        │
        ▼
BEGIN DATABASE TRANSACTION
        │
        ├── Create Sale
        │
        ├── Create SaleItems
        │
        ├── Decrease Inventory
        │
        └── Create InventoryMovement
        │
        ▼
COMMIT
        │
        ▼
Return Successful Sale
        │
        ├── Sales History updated
        ├── Inventory updated
        ├── Analytics updated through queries
        └── Reports reflect new transaction
```

This flow must be implemented correctly before moving heavily into analytics/reporting.

---

# 121. FINAL IMPLEMENTATION RULES FOR THE AI AGENT

When implementing this specification:

### DO

- Inspect the existing code first.
- Reuse existing architecture.
- Preserve existing working functionality.
- Use Prisma correctly.
- Use PostgreSQL transactions.
- Validate on the server.
- Enforce role authorization on the server.
- Enforce shop-level authorization.
- Keep financial values historically accurate.
- Keep inventory and sales consistent.
- Record inventory movements.
- Use Decimal/Numeric for money.
- Use pagination for large datasets.
- Use server-side filtering for reports.
- Write tests for critical business logic.
- Build incrementally.
- Explain important architectural decisions before making destructive changes.

### DO NOT

- Trust frontend prices.
- Trust frontend profit values.
- Trust frontend shop IDs.
- Allow negative inventory by default.
- Delete historical sales.
- Recalculate old sales using current prices.
- Allow employees to access another shop.
- Put analytics numbers into manually maintained fields.
- Duplicate business logic unnecessarily.
- Build analytics before sales/inventory logic is correct.
- Replace the existing architecture unnecessarily.
- Introduce unnecessary technologies.
- Create duplicate database models.
- Rewrite the whole project just to implement these features.

---

# 122. PRIMARY SUCCESS CRITERIA

The system is successful when the following scenario works perfectly:

```text
ADMIN
 ↓
Creates Coca Cola product
 ↓
Cost = 800
Selling = 1,200
 ↓
Adds 100 units
 ↓
Allocates:
Shop A = 40
Shop B = 35
Shop C = 25
```

Then:

```text
EMPLOYEE A
 ↓
Logs into Shop A
 ↓
Sees Coca Cola
 ↓
Sees stock = 40
 ↓
Records sale of 3
```

System automatically:

```text
Sale:
3 × 1,200 = 3,600

Cost:
3 × 800 = 2,400

Profit:
1,200

Inventory:
40 → 37

Movement:
SALE -3
```

Admin immediately sees:

```text
Revenue +3,600
Profit +1,200
Units Sold +3

Shop A Stock = 37
```

Reports correctly show the transaction.

If the Product price later changes:

```text
Cost = 1,000
Selling = 1,500
```

the historical sale remains:

```text
Cost = 800
Selling = 1,200
Profit = 1,200
```

That is the core integrity requirement of the entire system.

---

# 123. FINAL INSTRUCTION

Treat this document as the **business logic specification and source of truth** for the Product, Inventory, Sales, Analytics, and Reports modules.

However:

> The existing repository is the source of truth for the current implementation.

Therefore, before changing code:

1. Inspect the current repository.
2. Compare the existing implementation against this specification.
3. Identify what already exists.
4. Identify gaps.
5. Implement only the missing/incorrect pieces.
6. Preserve existing functionality.
7. Do not blindly recreate existing models/components/routes.
8. If an existing implementation conflicts with this specification, explain the conflict and propose the safest migration path before making destructive changes.

The ultimate goal is a reliable internal business platform where:

```text
Products
     ↓
Inventory
     ↓
Sales
     ↓
Analytics
     ↓
Reports
```

remain consistent, auditable, secure, and historically accurate.