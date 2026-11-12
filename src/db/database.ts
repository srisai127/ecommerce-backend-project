import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { config } from "../config/env";

const absoluteDbPath = path.resolve(process.cwd(), config.dbPath);
fs.mkdirSync(path.dirname(absoluteDbPath), { recursive: true });

export const db = new Database(absoluteDbPath);
db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");

const schemaPath = path.resolve(process.cwd(), "database", "schema.sql");
if (!fs.existsSync(schemaPath)) {
  throw new Error(`Database schema was not found at ${schemaPath}. Start the app from the project root.`);
}
db.exec(fs.readFileSync(schemaPath, "utf8"));

export function closeDatabase(): void {
  db.close();
}
