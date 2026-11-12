# API Documentation

Base URL: `http://localhost:3000/api`

All request and response bodies are JSON. Protected endpoints require:

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

Money is represented as integer paise (`pricePaise`, `totalPaise`). A value of `10000` is ₹100.00.

## Health

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/health` | Public | Check API status |

## Authentication

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/auth/register` | Public | Create a customer account |
| POST | `/auth/login` | Public | Login and receive a JWT |
| GET | `/auth/me` | Logged-in | Get the current account |

### Register

`POST /auth/register`

```json
{
  "name": "Asha Kumar",
  "email": "asha@example.com",
  "password": "strongpass123"
}
```

Password must contain at least 8 characters. Public registration always creates a `customer`; an account cannot assign itself the admin role.

### Login

`POST /auth/login`

```json
{
  "email": "asha@example.com",
  "password": "strongpass123"
}
```

Response includes `user` and `token`. Send the token as a Bearer token to protected endpoints.

## Categories

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/categories` | Public | List categories |
| POST | `/categories` | Admin | Create a category |

`POST /categories` body:

```json
{
  "name": "Accessories",
  "slug": "accessories",
  "description": "Computer and phone accessories"
}
```

The slug is optional; when omitted it is generated from the category name.

## Products and inventory

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/products` | Public | List/search/filter products |
| GET | `/products/:id` | Public | Get one active product |
| POST | `/products` | Admin | Create a product |
| PATCH | `/products/:id` | Admin | Update product details or stock |
| PATCH | `/products/:id/stock` | Admin | Set stock quantity |
| DELETE | `/products/:id` | Admin | Soft-delete (hide) product |

List query parameters:

- `search`: searches product name, description, or SKU.
- `category`: filters by category slug, e.g. `electronics`.
- `page`: page number (default `1`).
- `limit`: results per page (default `10`, maximum `50`).

Create product body:

```json
{
  "categoryId": 1,
  "name": "Keyboard",
  "description": "Compact USB keyboard",
  "sku": "ELEC-KEYBOARD-005",
  "pricePaise": 129900,
  "stockQuantity": 20
}
```

Update product accepts any subset of those fields plus `isActive` (`true` or `false`). Stock endpoint body:

```json
{ "stockQuantity": 35 }
```

Deleting a product sets `is_active` to false; it does not erase order history.

## Shopping cart

All cart endpoints require a customer JWT (admin JWTs also authenticate, but carts are still tied to the logged-in account).

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/cart` | View the current cart |
| POST | `/cart/items` | Add quantity of a product |
| PATCH | `/cart/items/:productId` | Set the cart quantity for a product |
| DELETE | `/cart/items/:productId` | Remove a product |
| DELETE | `/cart` | Clear the cart |

Add item body:

```json
{ "productId": 1, "quantity": 2 }
```

Adding to an existing cart line increases its quantity. The API rejects quantities greater than available stock. `PATCH` sets the line to the supplied quantity (it does not add to it).

## Orders and simulated payments

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/orders/checkout` | Logged-in | Convert cart to an order and simulate payment |
| GET | `/orders` | Logged-in | List own orders; admins see all orders |
| GET | `/orders/:id` | Owner or admin | View order details |

Checkout body:

```json
{
  "shippingAddress": "12 Example Road, Hyderabad, Telangana",
  "paymentToken": "tok_test_success"
}
```

Use one of these test tokens:

- `tok_test_success`: payment is approved; order becomes `confirmed`, stock is reduced, and the cart is cleared.
- `tok_test_decline`: payment is declined; order is recorded as `payment_failed`, stock is unchanged, and the cart is retained.

The endpoint returns HTTP `201` for success and `402` for a simulated decline. This is **not** a real gateway and never accepts card details.

## Common errors

| HTTP status | Meaning |
|---|---|
| 400 | Invalid input, empty cart, or invalid payment test token |
| 401 | Missing, invalid, or expired JWT; invalid login |
| 402 | Simulated payment declined |
| 403 | Authenticated user lacks admin permission |
| 404 | Resource or route not found |
| 409 | Duplicate unique value or insufficient stock |
| 500 | Unexpected server error |

Error body format:

```json
{ "error": "A readable error message." }
```
