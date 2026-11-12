# User Guide

## Start the application

1. Install Node.js 22+ and VS Code.
2. Extract and open this project folder in VS Code.
3. Run `npm install` in the integrated terminal.
4. Copy `.env.example` to `.env` using the command for your operating system (see the main README).
5. Run `npm run dev`.
6. Confirm `http://localhost:3000/api/health` returns `"status": "ok"`.

## Customer workflow

1. Register with `POST /api/auth/register`.
2. Login with `POST /api/auth/login` and copy the returned JWT.
3. In Postman, select a protected request and set its Bearer token to that JWT.
4. Browse `GET /api/products` and `GET /api/categories`.
5. Add a product with `POST /api/cart/items`.
6. View or edit the cart with the cart endpoints.
7. Submit `POST /api/orders/checkout` with a shipping address and `tok_test_success`.
8. View orders with `GET /api/orders`.

## Administrator workflow

1. Login using the demo admin account listed in the README (or the values configured in `.env`).
2. Use the returned JWT as a Bearer token.
3. Create categories with `POST /api/categories`.
4. Add or edit products with `POST /api/products` and `PATCH /api/products/:id`.
5. Update inventory using `PATCH /api/products/:id/stock`.
6. Hide a listing with `DELETE /api/products/:id`.
7. View all customer orders using `GET /api/orders`.

## Payment test cases

For a successful payment, use `tok_test_success`. The order is confirmed, stock is deducted, and the cart is cleared.

For a declined payment, use `tok_test_decline`. The failed order and payment attempt are recorded. Inventory is unchanged and the cart remains available for another attempt.

Never enter real card or bank details. The simulator does not connect to a payment provider.
