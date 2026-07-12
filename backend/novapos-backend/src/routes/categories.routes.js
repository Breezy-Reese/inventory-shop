import { Router } from "express";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import { HttpError } from "../middleware/errorHandler.js";
import { logAction } from "../utils/helpers.js";

const router = Router();

router.get("/", async (_req, res) => {
  const categories = await Category.find().sort({ name: 1 }).lean();
  const counts = await Product.aggregate([
    { $group: { _id: "$categoryId", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
  res.json(
    categories.map((c) => ({ ...c, productCount: countMap.get(String(c._id)) ?? 0 })),
  );
});

router.post("/", async (req, res) => {
  const { name, description } = req.body;
  if (!name) throw new HttpError(400, "name is required");
  const category = await Category.create({ name, description });
  await logAction(req, { action: "create", entity: "Category", entityId: category._id.toString() });
  res.status(201).json(category);
});

router.put("/:id", async (req, res) => {
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true },
  );
  if (!category) throw new HttpError(404, "Category not found");
  await logAction(req, { action: "update", entity: "Category", entityId: category._id.toString() });
  res.json(category);
});

router.delete("/:id", async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw new HttpError(404, "Category not found");
  await logAction(req, { action: "delete", entity: "Category", entityId: req.params.id });
  res.status(204).end();
});

export default router;
