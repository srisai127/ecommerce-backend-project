import app from "./app";
import { config } from "./config/env";
import { db, closeDatabase } from "./db/database";
import { seedDatabase } from "./db/seed";

seedDatabase(db);
const server = app.listen(config.port, () => {
  console.log(`E-commerce API running at http://localhost:${config.port}`);
  console.log(`Health check: http://localhost:${config.port}/api/health`);
  if (config.nodeEnv !== "production") {
    console.log(`Demo admin: ${config.adminEmail} / ${config.adminPassword}`);
  }
});

function shutdown(): void {
  server.close(() => {
    closeDatabase();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
