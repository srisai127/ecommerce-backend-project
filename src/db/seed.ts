import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import type Database from "better-sqlite3";
import { config } from "../config/env";

export function seedDatabase(database: Database.Database): void {
  const sampleDataPath = path.resolve(process.cwd(), "database", "sample_data.sql");
  if (!fs.existsSync(sampleDataPath)) {
    throw new Error(`Sample data was not found at ${sampleDataPath}. Start the app from the project root.`);
  }
  database.exec(fs.readFileSync(sampleDataPath, "utf8"));

  const existingAdmin = database.prepare("SELECT id FROM users WHERE email = ?").get(config.adminEmail);
  if (!existingAdmin) {
    database.prepare(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')"
    ).run("Store Administrator", config.adminEmail, bcrypt.hashSync(config.adminPassword, 10));
  }
}
