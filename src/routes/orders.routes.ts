import { Router } from "express";
import { db } from "../db/database";
import { authenticate } from "../middleware/auth";
import { checkout } from "../services/order.service";
import { ApiError } from "../utils/errors";
import { parseId, requireString } from "../utils/validation";

const router = Router();
router.use(authenticate);

router.post("/checkout", (req, res) => {
  const body = req.body as Record<string, unknown>;
  const shippingAddress = requireString(body?.shippingAddress, "shippingAddress", 500);
  const paymentToken = requireString(body?.paymentToken, "paymentToken", 80);
  const result = checkout({ userId: req.user!.id, shippingAddress, paymentToken });
  res.status(result.status === "confirmed" ? 201 : 402).json(result);
});

router.get("/", (req, res) => {
  const isAdmin = req.user!.role === "admin";
  const orders = isAdmin
    ? db.prepare(`
        SELECT o.id, o.user_id AS userId, u.email, o.status, o.subtotal_paise AS subtotalPaise,
               o.total_paise AS totalPaise, o.shipping_address AS shippingAddress, o.created_at AS createdAt,
               p.status AS paymentStatus, p.payment_reference AS paymentReference
        FROM orders o JOIN users u ON u.id = o.user_id
        LEFT JOIN payments p ON p.order_id = o.id ORDER BY o.id DESC
      `).all()
    : db.prepare(`
        SELECT o.id, o.status, o.subtotal_paise AS subtotalPaise,
               o.total_paise AS totalPaise, o.shipping_address AS shippingAddress, o.created_at AS createdAt,
               p.status AS paymentStatus, p.payment_reference AS paymentReference
        FROM orders o LEFT JOIN payments p ON p.order_id = o.id
        WHERE o.user_id = ? ORDER BY o.id DESC
      `).all(req.user!.id);
  res.json({ orders });
});

router.get("/:id", (req, res) => {
  const id = parseId(req.params.id);
  const order = db.prepare(`
    SELECT o.id, o.user_id AS userId, o.status, o.subtotal_paise AS subtotalPaise,
           o.total_paise AS totalPaise, o.shipping_address AS shippingAddress, o.created_at AS createdAt,
           p.status AS paymentStatus, p.payment_reference AS paymentReference, p.provider AS paymentProvider
    FROM orders o LEFT JOIN payments p ON p.order_id = o.id WHERE o.id = ?
  `).get(id) as { userId: number } | undefined;
  if (!order || (order.userId !== req.user!.id && req.user!.role !== "admin")) {
    throw new ApiError(404, "Order not found.");
  }

  const items = db.prepare(`
    SELECT product_id AS productId, product_name AS productName, sku,
           unit_price_paise AS unitPricePaise, quantity,
           unit_price_paise * quantity AS lineTotalPaise
    FROM order_items WHERE order_id = ? ORDER BY id
  `).all(id);
  res.json({ order: { ...order, items } });
});

export default router;
