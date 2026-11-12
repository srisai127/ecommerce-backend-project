import { randomUUID } from "node:crypto";
import { db } from "../db/database";
import type { CartRow } from "../types";
import { ApiError } from "../utils/errors";

export interface CheckoutInput {
  userId: number;
  shippingAddress: string;
  paymentToken: string;
}

export function checkout(input: CheckoutInput) {
  if (!["tok_test_success", "tok_test_decline"].includes(input.paymentToken)) {
    throw new ApiError(400, "Use tok_test_success or tok_test_decline for the payment simulation.");
  }

  const transaction = db.transaction(() => {
    const items = db.prepare(`
      SELECT p.id AS product_id, p.name, p.description, p.sku,
             p.price_paise, p.stock_quantity, ci.quantity, c.name AS category_name
      FROM cart_items ci
      JOIN products p ON p.id = ci.product_id
      JOIN categories c ON c.id = p.category_id
      WHERE ci.user_id = ? AND p.is_active = 1
    `).all(input.userId) as CartRow[];

    if (items.length === 0) throw new ApiError(400, "Your cart is empty.");
    for (const item of items) {
      if (item.quantity > item.stock_quantity) {
        throw new ApiError(409, `Insufficient stock for ${item.name}. Available: ${item.stock_quantity}.`);
      }
    }

    const totalPaise = items.reduce((sum, item) => sum + item.price_paise * item.quantity, 0);
    const paymentSucceeded = input.paymentToken === "tok_test_success";
    const orderStatus = paymentSucceeded ? "confirmed" : "payment_failed";
    const paymentStatus = paymentSucceeded ? "paid" : "failed";

    const orderResult = db.prepare(`
      INSERT INTO orders (user_id, status, subtotal_paise, total_paise, shipping_address)
      VALUES (?, ?, ?, ?, ?)
    `).run(input.userId, orderStatus, totalPaise, totalPaise, input.shippingAddress);
    const orderId = Number(orderResult.lastInsertRowid);

    const insertItem = db.prepare(`
      INSERT INTO order_items
        (order_id, product_id, product_name, sku, unit_price_paise, quantity)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const reduceStock = db.prepare(`
      UPDATE products SET stock_quantity = stock_quantity - ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND stock_quantity >= ?
    `);

    for (const item of items) {
      insertItem.run(orderId, item.product_id, item.name, item.sku, item.price_paise, item.quantity);
      if (paymentSucceeded) {
        const stockResult = reduceStock.run(item.quantity, item.product_id, item.quantity);
        if (stockResult.changes !== 1) throw new ApiError(409, `Stock changed while checking out: ${item.name}.`);
      }
    }

    const paymentReference = `SIM-${randomUUID()}`;
    db.prepare(`
      INSERT INTO payments (order_id, payment_reference, status, amount_paise)
      VALUES (?, ?, ?, ?)
    `).run(orderId, paymentReference, paymentStatus, totalPaise);

    if (paymentSucceeded) {
      db.prepare("DELETE FROM cart_items WHERE user_id = ?").run(input.userId);
    }

    return {
      orderId,
      status: orderStatus,
      totalPaise,
      payment: { reference: paymentReference, status: paymentStatus, provider: "SIMULATED_GATEWAY" },
      message: paymentSucceeded
        ? "Payment approved. Order confirmed and inventory updated."
        : "Payment declined by the simulator. The order was recorded as failed and your cart was kept."
    };
  });

  return transaction();
}
