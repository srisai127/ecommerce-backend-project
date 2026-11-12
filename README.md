# E-commerce Backend (Express + TypeScript + SQLite)

A cross-platform REST API project for an e-commerce store. It includes a product catalog, categories, stock tracking, customer accounts, JWT authentication, shopping carts, order processing, and a **simulated** payment gateway.

## 1. What to install first

Install these on **Windows or macOS**:

1. **Node.js 22 or newer** (npm is included). Download the LTS installer from <https://nodejs.org/>.
2. **Visual Studio Code** from <https://code.visualstudio.com/>.
3. **SQLite** is already installed on your system, as you mentioned. The application also bundles its SQLite engine through the `better-sqlite3` Node package, so you do not need to start a separate database server. The SQLite command-line program is optional.
4. **Postman** (optional, recommended for testing the API) from <https://www.postman.com/downloads/>.

No Python, Java, MySQL, MongoDB, or Docker installation is required.

### VS Code extensions

Recommended: **ESLint** and **Prettier**. They are helpful but not required to run the project. VS Code's built-in TypeScript support is sufficient.

## 2. Open the project

1. Extract the ZIP file.
2. Open VS Code.
3. Select **File → Open Folder** and choose the extracted `ecommerce-backend` folder.
4. Open the VS Code terminal: **Terminal → New Terminal**.

Run all commands below from the project root (the folder containing `package.json`). Commands are the same on Windows PowerShell, Windows Command Prompt, and macOS Terminal.

## 3. Install and configure

```bash
npm install
```

Create your local environment file:

**Windows PowerShell:**
```powershell
Copy-Item .env.example .env
```

**Windows Command Prompt:**
```cmd
copy .env.example .env
```

**macOS Terminal:**
```bash
cp .env.example .env
```

Open `.env` in VS Code. For a classroom/demo run, the supplied values work. The demo administrator is:

- Email: `admin@shop.local`
- Password: `Admin123!`

Set `ADMIN_PASSWORD` and `JWT_SECRET` before the first run. The admin account is created only once, so changing `ADMIN_PASSWORD` later does not reset an already-created account. Change the credentials before sharing or deploying the application; the defaults and development secret are for local demonstration only.

## 4. Run the project

### Development mode (recommended while editing)

```bash
npm run dev
```

The API should start at `http://localhost:3000`.

Open <http://localhost:3000/api/health> in a browser. A successful response looks like:

```json
{
  "status": "ok",
  "service": "e-commerce-api",
  "timestamp": "..."
}
```

The SQLite database is created automatically at `data/shop.db` on the first run. Sample categories, products, and the demo administrator are inserted automatically. Keep the terminal running while using the API. Press `Ctrl + C` to stop it.

### Build and run the compiled TypeScript version

```bash
npm run build
npm start
```

### Type-check without starting the server

```bash
npm run typecheck
```

## 5. Test with Postman

Import `postman/E-commerce-Backend.postman_collection.json` into Postman. Set the collection variable `baseUrl` to `http://localhost:3000` if needed.

Suggested test sequence:

1. `Health check`.
2. `Register customer` (or use the preloaded demo admin for admin endpoints).
3. `Login admin` to save an administrator JWT in the collection variable `token`.
4. `List categories` and `List products`.
5. `Create product` or `Update stock` as admin.
6. `Register customer` and `Login customer` (the customer login request saves its token to `customerToken`).
7. `Add item to cart`, then `View cart` using the customer token.
8. `Checkout - simulated success` using `tok_test_success`.
9. `List my orders` and `Get order by ID`.
10. To test a declined payment, add an item again and checkout with `tok_test_decline`. The failed order is recorded, stock is not reduced, and the cart is retained.

In Postman, the collection has separate `token` and `customerToken` variables. Use the `Authorization` header `Bearer {{customerToken}}` for customer cart and checkout requests; admin operations use `Bearer {{token}}`.

## 6. Main features

- Customer registration and login, with passwords hashed using bcrypt-compatible `bcryptjs`.
- JWT authentication and role-based authorization (`customer` / `admin`).
- Product listing, search, category filtering, pagination, and product detail.
- Admin-only product creation, editing, soft deletion, category creation, and inventory updates.
- Per-customer shopping cart with stock checks.
- Order history and order detail endpoints.
- Transactional checkout: verifies stock, records an order and payment result, deducts stock only after simulated payment succeeds, and clears the cart after success.
- Central input checks, HTTP error handling, Helmet security headers, and JSON request size limit.

## 7. Database and money values

The database file is `data/shop.db`. Its structure is defined in `database/schema.sql`; demo categories and products are in `database/sample_data.sql`. Money is stored as an integer number of **paise** to avoid floating-point rounding. For example, `pricePaise: 79900` means ₹799.00.

You can inspect the database with an SQLite GUI or the SQLite command line, if installed. The application itself does not require you to create tables manually.

To reset the demo database, stop the server and delete `data/shop.db` (and, if present, `data/shop.db-shm` and `data/shop.db-wal`). Restart the server to recreate the schema and sample data. This permanently deletes local test accounts, carts, and orders.

## 8. Project structure

```text
ecommerce-backend/
├── database/
│   └── schema.sql
├── docs/
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── ER_DIAGRAM.md
│   └── USER_GUIDE.md
├── postman/
│   └── E-commerce-Backend.postman_collection.json
├── src/
│   ├── config/          # Environment configuration
│   ├── db/              # SQLite connection and sample data
│   ├── middleware/      # JWT, admin authorization, errors
│   ├── routes/          # REST API endpoints
│   ├── services/        # Checkout/order business logic
│   ├── types/           # TypeScript interfaces and Express types
│   ├── utils/           # Validation and API errors
│   ├── app.ts
│   └── server.ts
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## 9. Important project scope

This is an educational backend, not a production payment system. The payment gateway is simulated using `tok_test_success` and `tok_test_decline`; no card number, CVV, bank credential, or real payment is accepted or stored. Shipping is represented by a text address. There is no frontend because the assignment asks for a backend; Postman is used to call the REST API.

Before production use, add a real payment provider, email verification, password reset, stronger rate limiting, audit logging, deployment secrets, HTTPS, backups, and a proper shipping/address model.
