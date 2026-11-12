import { Router } from "express";
import { db } from "../db/database";
import { authenticate } from "../middleware/auth";
import type { CartRow } from "../types";
import { ApiError } from "../utils/errors";
import { parseId, requirePositiveInteger } from "../utils/validation";

const router = Router();
router.use(authenticate);

function readCart(userId: number) {
  const items = db.prepare(`
    SELECT p.id AS product_id, p.name, p.description, p.sku,
           p.price_paise, p.stock_quantity, ci.quantity, c.name AS category_name
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    JOIN categories c ON c.id = p.category_id
    WHERE ci.user_id = ? AND p.is_active = 1
    ORDER BY ci.id
  `).all(userId) as CartRow[];
  const mappedItems = items.map((item) => ({
    productId: item.product_id,
    name: item.name,
    description: item.description,
    sku: item.sku,
    category: item.category_name,
    pricePaise: item.price_paise,
    quantity: item.quantity,
    stockAvailable: item.stock_quantity,
    lineTotalPaise: item.price_paise * item.quantity
  }));
  return {
    items: mappedItems,
    totalPaise: mappedItems.reduce((total, item) => total + item.lineTotalPaise, 0)
  };
}

router.get("/", (req, res) => {
  res.json({ cart: readCart(req.user!.id) });
});

router.post("/items", (req, res) => {
  const body = req.body as Record<string, unknown>;
  const productId = requirePositiveInteger(body?.productId, "productId");
  const quantity = requirePositiveInteger(body?.quantity, "quantity");
  const product = db.prepare("SELECT id, stock_quantity, is_active FROM products WHERE id = ?")
    .get(productId) as { id: number; stock_quantity: number; is_active: number } | undefined;
  if (!product || product.is_active !== 1) throw new ApiError(404, "Active product not found.");

  const current = db.prepare("SELECT quantity FROM cart_items WHERE user_id = ? AND product_id = ?")
    .get(req.user!.id, productId) as { quantity: number } | undefined;
  const newQuantity = (current?.quantity ?? 0) + quantity;
  if (newQuantity > product.stock_quantity) {
    throw new ApiError(409, `Only ${product.stock_quantity} unit(s) are currently in stock.`);
  }

  db.prepare(`
    INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)
    ON CONFLICT(user_id, product_id) DO UPDATE SET quantity = excluded.quantity, updated_at = CURRENT_TIMESTAMP
  `).run(req.user!.id, productId, newQuantity);
  res.status(201).json({ message: "Item added to cart.", cart: readCart(req.user!.id) });
});

router.patch("/items/:productId", (req, res) => {
  const productId = parseId(req.params.productId, "productId");
  const quantity = requirePositiveInteger((req.body as Record<string, unknown>)?.quantity, "quantity");
  const product = db.prepare("SELECT stock_quantity, is_active FROM products WHERE id = ?")
    .get(productId) as { stock_quantity: number; is_active: number } | undefined;
  if (!product || product.is_active !== 1) throw new ApiError(404, "Active product not found.");
  if (quantity > product.stock_quantity) throw new ApiError(409, `Only ${product.stock_quantity} unit(s) are currently in stock.`);

  const result = db.prepare(`
    UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ? AND product_id = ?
  `).run(quantity, req.user!.id, productId);
  if (result.changes === 0) throw new ApiError(404, "Item is not in your cart.");
  res.json({ message: "Cart quantity updated.", cart: readCart(req.user!.id) });
});

router.delete("/items/:productId", (req, res) => {
  const productId = parseId(req.params.productId, "productId");
  const result = db.prepare("DELETE FROM cart_items WHERE user_id = ? AND product_id = ?")
    .run(req.user!.id, productId);
  if (result.changes === 0) throw new ApiError(404, "Item is not in your cart.");
  res.json({ message: "Item removed.", cart: readCart(req.user!.id) });
});

router.delete("/", (req, res) => {
  db.prepare("DELETE FROM cart_items WHERE user_id = ?").run(req.user!.id);
  res.json({ message: "Cart cleared.", cart: readCart(req.user!.id) });
});

export default router;
