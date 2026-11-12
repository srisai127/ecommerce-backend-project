import "dotenv/config";
import type { SignOptions } from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET ?? "local-development-secret-change-before-deployment";

if (process.env.NODE_ENV === "production" && jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must contain at least 32 characters in production.");
}

export const config = {
  port: Number.parseInt(process.env.PORT ?? "3000", 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
  jwtSecret,
  jwtExpiresIn: (process.env.JWT_EXPIRES_IN ?? "1d") as SignOptions["expiresIn"],
  dbPath: process.env.DB_PATH ?? "data/shop.db",
  adminEmail: (process.env.ADMIN_EMAIL ?? "admin@shop.local").toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD ?? "Admin123!",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000"
};
