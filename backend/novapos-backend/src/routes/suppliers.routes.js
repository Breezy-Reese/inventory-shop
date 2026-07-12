import { Router } from "express";
import Supplier from "../models/Supplier.js";
import { HttpError } from "../middleware/errorHandler.js";
import { logAction } from "../utils/helpers.js";

const router = Router();

router.get("/", async (_req, res) => {
  const suppliers = await Supplier.find().sort({ name: 1 });
  res.json(suppliers);
});

router.post("/", async (req, res) => {
  const { name } = req.body;
  if (!name) throw new HttpError(400, "name is required");
  const supplier = await Supplier.create(req.body);
  await logAction(req, { action: "create", entity: "Supplier", entityId: supplier._id.toString() });
  res.status(201).json(supplier);
});

router.put("/:id", async (req, res) => {
  const supplier = await Supplier.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true },
  );
  if (!supplier) throw new HttpError(404, "Supplier not found");
  await logAction(req, { action: "update", entity: "Supplier", entityId: supplier._id.toString() });
  res.json(supplier);
});

router.delete("/:id", async (req, res) => {
  const supplier = await Supplier.findByIdAndDelete(req.params.id);
  if (!supplier) throw new HttpError(404, "Supplier not found");
  await logAction(req, { action: "delete", entity: "Supplier", entityId: req.params.id });
  res.status(204).end();
});

export default router;
