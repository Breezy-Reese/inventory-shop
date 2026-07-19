import "express-async-errors";
import express from "express";
import cors from "cors";
import morgan from "morgan";

import { requireAuth } from "./middleware/auth.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/auth.routes.js";
import categoryRoutes from "./routes/categories.routes.js";
import productRoutes from "./routes/products.routes.js";
import supplierRoutes from "./routes/suppliers.routes.js";
import customerRoutes from "./routes/customers.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import purchaseRoutes from "./routes/purchases.routes.js";
import saleRoutes from "./routes/sales.routes.js";
import reportRoutes from "./routes/reports.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import auditLogRoutes from "./routes/auditLogs.routes.js";
import publicRoutes from "./routes/public.routes.js";
import orderRoutes from "./routes/orders.routes.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : "*",
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(morgan("dev"));

  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  // Public — no login required (customer storefront)
  app.use("/api/auth", authRoutes);
  app.use("/api/public", publicRoutes);

  // Everything below requires a valid bearer token
  app.use("/api", requireAuth);

  app.use("/api/orders", orderRoutes);
  app.use("/api/categories", categoryRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/suppliers", supplierRoutes);
  app.use("/api/customers", customerRoutes);
  app.use("/api/inventory", inventoryRoutes);
  app.use("/api/purchases", purchaseRoutes);
  app.use("/api/sales", saleRoutes);
  app.use("/api/reports", reportRoutes);
  app.use("/api/settings", settingsRoutes);
  app.use("/api/audit-logs", auditLogRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
