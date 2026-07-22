# NovaPOS backend

Express + MongoDB (Mongoose) REST API built to match the NovaPOS frontend's
API contract exactly (see `src/lib/api.ts` in the frontend repo). Point the
frontend's `VITE_API_URL` at this server and everything — auth, POS
checkout, products, purchases, inventory, reports, settings, audit logs —
works out of the box.

## Stack

- Node.js (ESM) + Express 4
- MongoDB + Mongoose
- JWT auth (`jsonwebtoken` + `bcryptjs`)

## Setup

```bash
cd novapos-backend
npm install
cp .env.example .env    # then edit MONGODB_URI / JWT_SECRET as needed
```

You need a MongoDB instance. Easiest options:
- Local: `mongod` running on `mongodb://127.0.0.1:27017`
- Free hosted: a MongoDB Atlas cluster — put the connection string in `MONGODB_URI`

Seed some demo data (a store, categories, products, a supplier, customers,
and an admin login):

```bash
npm run seed
```

This creates the login  (the very first
registered/seeded user automatically becomes `admin`).

Start the API:

```bash
npm run dev     # auto-restart on changes
# or
npm start
```

By default it listens on `http://localhost:4000` and every route is mounted
under `/api`, e.g. `http://localhost:4000/api/products`.

## Connecting the frontend

In the frontend project, set:

```
VITE_API_URL=http://localhost:4000/api
```

Then `npm run dev` the frontend. Sign in (or register) from the `/auth`
screen, and every screen — dashboard, POS, products, inventory, purchases,
sales, reports, settings, audit logs — will be backed by this API.

## Auth model

- `POST /api/auth/register` — creates a user, returns `{ token, user }`.
  The very first user created (via register or seed) is auto-promoted to
  `admin`; everyone after defaults to `cashier` unless a `role` is passed.
- `POST /api/auth/login` — returns `{ token, user }`.
- Every other route requires `Authorization: Bearer <token>`.
- `GET /api/auth/me` — returns the current user (handy for silent
  re-hydration/refresh flows if you want to add one later).

## Design notes

- **Inventory is derived, not duplicated.** `Product.stock` is the single
  source of truth for on-hand quantity. `GET /inventory` and
  `GET /reports/inventory` just reshape `Product` documents into the
  `InventoryItem` shape the UI expects, so stock never drifts between two
  collections. Every stock-changing action (sale, purchase receipt, manual
  adjustment, direct product edit) also writes a `StockMovement` audit
  record, which powers `GET /inventory/movements`.
- **Sales are transactional at the application level**: a sale is rejected
  up front if any line item doesn't have enough stock; on success it
  decrements product stock, logs stock movements, and updates the
  customer's `totalSpent`/`loyaltyPoints` if a customer was attached.
- **Purchases** are created as `pending` and only affect stock once you call
  `POST /purchases/:id/receive`, which bumps `Product.stock`, refreshes
  `Product.costPrice` to the latest purchase cost, and logs stock movements.
- **Reports**
  - `GET /reports/summary` powers the dashboard: today's revenue/orders,
    this month's revenue, low-stock count, a 14-day revenue trend, and top
    5 products by revenue.
  - `GET /reports/sales?from&to` and `GET /reports/profit?from&to` return
    daily aggregates (`profit` is computed from each sale item's product
    `costPrice` at query time).
  - `GET /reports/expenses?from&to` reads from a simple `Expense`
    collection (there's no UI to create expenses in the current frontend,
    so seed/insert them directly if you want to populate that tab).
- **Settings** is a singleton document — `GET`/`PUT /api/settings` always
  operate on the one store-settings record, creating it with defaults on
  first read.
- **Audit logs** are written automatically for create/update/delete/login/
  stock-adjustment/purchase-receive actions and exposed read-only via
  `GET /api/audit-logs`.

## Customer-facing storefront (new)

Two extra pieces beyond the original admin API:

- **`/api/public/*` — no login required.** Lets customers browse active
  products (with photos, price, description, in-stock status — never cost
  price or exact stock counts) and place an order themselves. Prices are
  always recomputed server-side from the current `Product` record, never
  trusted from the client. Placing an order immediately reserves stock
  (decrements `Product.stock`) so two customers can't both "buy" the last
  unit; a `StockMovement` is logged with reason `"Online order"`.
- **`/api/orders/*` — staff-only.** Lets your team see incoming online
  orders and move them through `pending → confirmed → fulfilled` (or
  `cancelled`). Cancelling an order automatically restocks the reserved
  items. Marking an order `fulfilled` automatically creates a matching
  `Sale` record (`paymentMethod: "online"`), so online revenue shows up in
  `/reports/summary`, `/reports/sales`, and `/reports/profit` right
  alongside in-store sales — no separate reporting needed.

`Product` now also has an optional `description` field for catalog copy,
alongside the `imageUrl` field that already existed.

### Public endpoints

```
GET  /api/public/categories
GET  /api/public/products?category=<id>&q=<search>
GET  /api/public/products/:id
POST /api/public/orders
     { customerName, customerPhone, customerEmail?, fulfillmentType: "pickup"|"delivery",
       deliveryAddress? (required if delivery), notes?,
       items: [{ productId, quantity }] }
GET  /api/public/orders/track?orderNumber=ORD-123456&phone=+254...
```

### Staff endpoints (require `Authorization: Bearer <token>`)

```
GET  /api/orders?status=pending
GET  /api/orders/:id
PUT  /api/orders/:id/status     { status: "confirmed" | "fulfilled" | "cancelled" }
```

### What's still needed on the frontend

This backend is ready, but your current frontend (the Lovable admin app) is
staff-only and behind login — there's no public page yet. You'll need two
new things there:

1. A **public storefront page** (product grid with photos, add-to-cart,
   checkout form) that talks to `/api/public/products` and
   `/api/public/orders` — this page must **not** require sign-in.
2. An **Orders** screen in the admin sidebar (similar to your existing
   Purchases screen) that lists `/api/orders`, shows status, and lets staff
   advance/cancel orders via `PUT /api/orders/:id/status`.
3. An **image URL field** on the existing product create/edit form, so
   staff can attach a photo per product (`imageUrl`, plus the new
   `description` field for catalog copy).

## API surface

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/products            POST /api/products
PUT    /api/products/:id        DELETE /api/products/:id

GET    /api/categories          POST /api/categories
PUT    /api/categories/:id      DELETE /api/categories/:id

GET    /api/suppliers           POST /api/suppliers
PUT    /api/suppliers/:id       DELETE /api/suppliers/:id

GET    /api/customers           POST /api/customers
PUT    /api/customers/:id       DELETE /api/customers/:id

GET    /api/inventory
GET    /api/inventory/movements
POST   /api/inventory/adjustments   { productId, quantity, reason }

GET    /api/purchases           POST /api/purchases
POST   /api/purchases/:id/receive

GET    /api/sales               POST /api/sales

GET    /api/reports/summary
GET    /api/reports/sales?from=YYYY-MM-DD&to=YYYY-MM-DD
GET    /api/reports/profit?from=YYYY-MM-DD&to=YYYY-MM-DD
GET    /api/reports/inventory
GET    /api/reports/expenses?from=YYYY-MM-DD&to=YYYY-MM-DD

GET    /api/settings            PUT /api/settings

GET    /api/audit-logs
```

All routes except `/api/auth/register` and `/api/auth/login` require the
`Authorization: Bearer <token>` header.

## Deploying

This is a plain Node process — deploy it anywhere that runs Node 18+ and
can reach your MongoDB instance (Render, Railway, Fly.io, a VPS, etc.). Set
`MONGODB_URI`, `JWT_SECRET`, and `CORS_ORIGIN` (comma-separated list of
allowed frontend origins) as environment variables in that environment.
