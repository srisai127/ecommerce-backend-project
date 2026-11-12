import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "./config/env";
import authRoutes from "./routes/auth.routes";
import categoryRoutes from "./routes/categories.routes";
import productRoutes from "./routes/products.routes";
import cartRoutes from "./routes/cart.routes";
import orderRoutes from "./routes/orders.routes";
import { errorHandler, notFound } from "./middleware/errorHandler";

const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: config.corsOrigin.split(",").map((item) => item.trim()) }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan(config.nodeEnv === "production" ? "combined" : "dev"));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "e-commerce-api", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
