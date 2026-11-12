import { Router } from "express";
import { db } from "../db/database";
import { authenticate, requireAdmin } from "../middleware/auth";
import { ApiError } from "../utils/errors";
import { requireString } from "../utils/validation";

const router = Router();

router.get("/", (_req, res) => {
  const categories = db.prepare(
    "SELECT id, name, slug, description FROM categories ORDER BY name"
  ).all();
  res.json({ categories });
});

router.post("/", authenticate, requireAdmin, (req, res) => {
  const body = req.body as Record<string, unknown>;
  const name = requireString(body?.name, "name", 80);
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const slug = (typeof body?.slug === "string" && body.slug.trim()
    ? body.slug.trim()
    : name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  if (!slug || slug.length > 100) throw new ApiError(400, "slug must be 1–100 characters.");

  const result = db.prepare(
    "INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)"
  ).run(name, slug, description);
  res.status(201).json({
    category: db.prepare("SELECT id, name, slug, description FROM categories WHERE id = ?")
      .get(Number(result.lastInsertRowid))
  });
});

export default router;
