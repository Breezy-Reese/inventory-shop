import { Router } from "express";
import Product from "../models/Product.js";
import StockMovement from "../models/StockMovement.js";
import { HttpError } from "../middleware/errorHandler.js";
import { logAction } from "../utils/helpers.js";

const router = Router();

function serialize(product) {
  const obj = product.toObject ? product.toObject() : product;
  return {
    ...obj,
    category: obj.categoryId,
  };
}

router.get("/", async (_req, res) => {
  const products = await Product.find().populate("categoryId").sort({ createdAt: -1 });
  res.json(products.map(serialize));
});

router.post("/", async (req, res) => {
  const { name, sku, costPrice, sellingPrice } = req.body;
  if (!name || !sku || costPrice === undefined || sellingPrice === undefined) {
    throw new HttpError(400, "name, sku, costPrice and sellingPrice are required");
  }

  const product = await Product.create(req.body);
  if (product.stock) {
    await StockMovement.create({
      productId: product._id,
      type: "in",
      quantity: product.stock,
      reason: "Initial stock",
    });
  }
  await logAction(req, { action: "create", entity: "Product", entityId: product._id.toString() });
  await product.populate("categoryId");
  res.status(201).json(serialize(product));
});

router.put("/:id", async (req, res) => {
  const existing = await Product.findById(req.params.id);
  if (!existing) throw new HttpError(404, "Product not found");

  const previousStock = existing.stock ?? 0;
  Object.assign(existing, req.body);
  await existing.save();

  if (req.body.stock !== undefined && req.body.stock !== previousStock) {
    const delta = req.body.stock - previousStock;
    await StockMovement.create({
      productId: existing._id,
      type: delta >= 0 ? "in" : "out",
      quantity: Math.abs(delta),
      reason: "Manual stock edit",
    });
  }

  await logAction(req, { action: "update", entity: "Product", entityId: existing._id.toString() });
  await existing.populate("categoryId");
  res.json(serialize(existing));
});

router.delete("/:id", async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new HttpError(404, "Product not found");
  await logAction(req, { action: "delete", entity: "Product", entityId: req.params.id });
  res.status(204).end();
});

export default router;
