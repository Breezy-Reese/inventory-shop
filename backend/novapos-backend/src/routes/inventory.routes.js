import { Router } from "express";
import Product from "../models/Product.js";
import StockMovement from "../models/StockMovement.js";
import { HttpError } from "../middleware/errorHandler.js";
import { logAction } from "../utils/helpers.js";

const router = Router();

// Stock levels are derived from the Product collection (single source of truth
// for on-hand quantity), reshaped into the InventoryItem contract the UI expects.
router.get("/", async (_req, res) => {
  const products = await Product.find().sort({ name: 1 });
  res.json(
    products.map((p) => ({
      _id: p._id,
      productId: p._id,
      product: p,
      name: p.name,
      sku: p.sku,
      quantity: p.stock ?? 0,
      lowStockThreshold: p.lowStockThreshold ?? 5,
      updatedAt: p.updatedAt,
    })),
  );
});

router.get("/movements", async (_req, res) => {
  const movements = await StockMovement.find()
    .populate("productId")
    .sort({ createdAt: -1 })
    .limit(500);
  res.json(movements);
});

router.post("/adjustments", async (req, res) => {
  const { productId, quantity, reason } = req.body;
  if (!productId || quantity === undefined) {
    throw new HttpError(400, "productId and quantity are required");
  }

  const product = await Product.findById(productId);
  if (!product) throw new HttpError(404, "Product not found");

  const delta = Number(quantity);
  const newStock = (product.stock ?? 0) + delta;
  if (newStock < 0) throw new HttpError(400, "Adjustment would result in negative stock");

  product.stock = newStock;
  await product.save();

  const movement = await StockMovement.create({
    productId: product._id,
    type: "adjustment",
    quantity: delta,
    reason: reason || "Manual adjustment",
  });

  await logAction(req, {
    action: "adjust_stock",
    entity: "Product",
    entityId: product._id.toString(),
    details: `${delta >= 0 ? "+" : ""}${delta} (${reason || "adjustment"})`,
  });

  res.status(201).json(movement);
});

export default router;
