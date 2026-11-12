import { Router } from "express";
import { db } from "../db/database";
import { authenticate, requireAdmin } from "../middleware/auth";
import { ApiError } from "../utils/errors";
import {
  optionalString, parseId, requireNonNegativeInteger, requirePositiveInteger, requireString
} from "../utils/validation";

const router = Router();

function productById(id: number): unknown {
  return db.prepare(`
    SELECT p.id, p.name, p.description, p.sku, p.price_paise AS pricePaise,
           p.stock_quantity AS stockQuantity, p.is_active AS isActive,
           p.category_id AS categoryId, c.name AS categoryName,
           p.created_at AS createdAt, p.updated_at AS updatedAt
    FROM products p JOIN categories c ON c.id = p.category_id
    WHERE p.id = ?
  `).get(id);
}

router.get("/", (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const category = typeof req.query.category === "string" ? req.query.category.trim() : "";
  const pageRaw = typeof req.query.page === "string" ? Number(req.query.page) : 1;
  const limitRaw = typeof req.query.limit === "string" ? Number(req.query.limit) : 10;
  const page = Number.isSafeInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const limit = Number.isSafeInteger(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 10;
  const offset = (page - 1) * limit;

  const conditions = ["p.is_active = 1"];
  const parameters: Array<string | number> = [];
  if (search) {
    conditions.push("(p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)");
    const term = `%${search}%`;
    parameters.push(term, term, term);
  }
  if (category) {
    conditions.push("c.slug = ?");
    parameters.push(category);
  }

  const where = conditions.join(" AND ");
  const total = (db.prepare(`SELECT COUNT(*) AS count FROM products p JOIN categories c ON c.id = p.category_id WHERE ${where}`)
    .get(...parameters) as { count: number }).count;
  const products = db.prepare(`
    SELECT p.id, p.name, p.description, p.sku, p.price_paise AS pricePaise,
           p.stock_quantity AS stockQuantity, p.category_id AS categoryId, c.name AS categoryName
    FROM products p JOIN categories c ON c.id = p.category_id
    WHERE ${where}
    ORDER BY p.id DESC LIMIT ? OFFSET ?
  `).all(...parameters, limit, offset);

  res.json({ products, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

router.get("/:id", (req, res) => {
  const id = parseId(req.params.id);
  const product = productById(id) as { isActive?: number } | undefined;
  if (!product || product.isActive === 0) throw new ApiError(404, "Product not found.");
  res.json({ product });
});

router.post("/", authenticate, requireAdmin, (req, res) => {
  const body = req.body as Record<string, unknown>;
  const categoryId = requirePositiveInteger(body?.categoryId, "categoryId");
  const name = requireString(body?.name, "name", 120);
  const description = optionalString(body?.description, "description", 2000) ?? "";
  const sku = requireString(body?.sku, "sku", 60);
  const pricePaise = requireNonNegativeInteger(body?.pricePaise, "pricePaise");
  const stockQuantity = requireNonNegativeInteger(body?.stockQuantity, "stockQuantity");
  const category = db.prepare("SELECT id FROM categories WHERE id = ?").get(categoryId);
  if (!category) throw new ApiError(400, "categoryId does not refer to an existing category.");

  const result = db.prepare(`
    INSERT INTO products (category_id, name, description, sku, price_paise, stock_quantity)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(categoryId, name, description, sku, pricePaise, stockQuantity);
  res.status(201).json({ product: productById(Number(result.lastInsertRowid)) });
});

router.patch("/:id", authenticate, requireAdmin, (req, res) => {
  const id = parseId(req.params.id);
  const existing = db.prepare("SELECT * FROM products WHERE id = ?").get(id) as {
    category_id: number; name: string; description: string; sku: string;
    price_paise: number; stock_quantity: number; is_active: number;
  } | undefined;
  if (!existing) throw new ApiError(404, "Product not found.");
  const body = req.body as Record<string, unknown>;

  const categoryId = body?.categoryId === undefined ? existing.category_id : requirePositiveInteger(body.categoryId, "categoryId");
  if (!db.prepare("SELECT id FROM categories WHERE id = ?").get(categoryId)) {
    throw new ApiError(400, "categoryId does not refer to an existing category.");
  }
  const name = body?.name === undefined ? existing.name : requireString(body.name, "name", 120);
  const description = body?.description === undefined ? existing.description : (optionalString(body.description, "description", 2000) ?? "");
  const sku = body?.sku === undefined ? existing.sku : requireString(body.sku, "sku", 60);
  const pricePaise = body?.pricePaise === undefined ? existing.price_paise : requireNonNegativeInteger(body.pricePaise, "pricePaise");
  const stockQuantity = body?.stockQuantity === undefined ? existing.stock_quantity : requireNonNegativeInteger(body.stockQuantity, "stockQuantity");
  const isActive = body?.isActive === undefined ? existing.is_active : (body.isActive === true ? 1 : body.isActive === false ? 0 : -1);
  if (isActive === -1) throw new ApiError(400, "isActive must be a boolean.");

  db.prepare(`
    UPDATE products SET category_id = ?, name = ?, description = ?, sku = ?,
      price_paise = ?, stock_quantity = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(categoryId, name, description, sku, pricePaise, stockQuantity, isActive, id);
  res.json({ product: productById(id) });
});

router.patch("/:id/stock", authenticate, requireAdmin, (req, res) => {
  const id = parseId(req.params.id);
  const stockQuantity = requireNonNegativeInteger((req.body as Record<string, unknown>)?.stockQuantity, "stockQuantity");
  const result = db.prepare(
    "UPDATE products SET stock_quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).run(stockQuantity, id);
  if (result.changes === 0) throw new ApiError(404, "Product not found.");
  res.json({ product: productById(id) });
});

router.delete("/:id", authenticate, requireAdmin, (req, res) => {
  const id = parseId(req.params.id);
  const result = db.prepare(
    "UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).run(id);
  if (result.changes === 0) throw new ApiError(404, "Product not found.");
  res.json({ message: "Product is now hidden from the public catalog." });
});

export default router;
