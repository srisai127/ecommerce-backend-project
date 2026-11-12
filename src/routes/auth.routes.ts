import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db/database";
import { authenticate } from "../middleware/auth";
import { config } from "../config/env";
import type { AuthUser, UserRole } from "../types";
import { ApiError } from "../utils/errors";
import { requireString } from "../utils/validation";

const router = Router();
interface UserRow extends AuthUser { password_hash: string; }

function publicUser(user: AuthUser): AuthUser {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

function createToken(user: AuthUser): string {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

router.post("/register", async (req, res) => {
  const body = req.body as Record<string, unknown>;
  const name = requireString(body?.name, "name", 80);
  const email = requireString(body?.email, "email", 254).toLowerCase();
  const password = requireString(body?.password, "password", 128);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError(400, "email must be a valid email address.");
  }
  if (password.length < 8) {
    throw new ApiError(400, "password must contain at least 8 characters.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const result = db.prepare(
    "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'customer')"
  ).run(name, email, passwordHash);

  const user: AuthUser = {
    id: Number(result.lastInsertRowid), name, email, role: "customer" as UserRole
  };
  res.status(201).json({ message: "Account created.", user, token: createToken(user) });
});

router.post("/login", async (req, res) => {
  const body = req.body as Record<string, unknown>;
  const email = requireString(body?.email, "email", 254).toLowerCase();
  const password = requireString(body?.password, "password", 128);
  const user = db.prepare("SELECT id, name, email, password_hash, role FROM users WHERE email = ?")
    .get(email) as UserRow | undefined;

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new ApiError(401, "Email or password is incorrect.");
  }

  const safeUser = publicUser(user);
  res.json({ message: "Login successful.", user: safeUser, token: createToken(safeUser) });
});

router.get("/me", authenticate, (req, res) => {
  const user = db.prepare("SELECT id, name, email, role FROM users WHERE id = ?")
    .get(req.user!.id) as AuthUser | undefined;
  if (!user) throw new ApiError(404, "User not found.");
  res.json({ user });
});

export default router;
