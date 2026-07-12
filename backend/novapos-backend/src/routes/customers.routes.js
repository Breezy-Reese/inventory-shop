import { Router } from "express";
import Customer from "../models/Customer.js";
import { HttpError } from "../middleware/errorHandler.js";
import { logAction } from "../utils/helpers.js";

const router = Router();

router.get("/", async (_req, res) => {
  const customers = await Customer.find().sort({ name: 1 });
  res.json(customers);
});

router.post("/", async (req, res) => {
  const { name } = req.body;
  if (!name) throw new HttpError(400, "name is required");
  const customer = await Customer.create(req.body);
  await logAction(req, { action: "create", entity: "Customer", entityId: customer._id.toString() });
  res.status(201).json(customer);
});

router.put("/:id", async (req, res) => {
  const customer = await Customer.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true },
  );
  if (!customer) throw new HttpError(404, "Customer not found");
  await logAction(req, { action: "update", entity: "Customer", entityId: customer._id.toString() });
  res.json(customer);
});

router.delete("/:id", async (req, res) => {
  const customer = await Customer.findByIdAndDelete(req.params.id);
  if (!customer) throw new HttpError(404, "Customer not found");
  await logAction(req, { action: "delete", entity: "Customer", entityId: req.params.id });
  res.status(204).end();
});

export default router;
