import { Router } from "express";
import Purchase from "../models/Purchase.js";
import Product from "../models/Product.js";
import StockMovement from "../models/StockMovement.js";
import { HttpError } from "../middleware/errorHandler.js";
import { generateCode, logAction } from "../utils/helpers.js";

const router = Router();

router.get("/", async (_req, res) => {
  const purchases = await Purchase.find()
    .populate("supplierId")
    .populate("items.productId")
    .sort({ createdAt: -1 });
  res.json(purchases);
});

router.post("/", async (req, res) => {
  const { supplierId, items, expectedDate, notes, status } = req.body;
  if (!supplierId || !Array.isArray(items) || items.length === 0) {
    throw new HttpError(400, "supplierId and at least one item are required");
  }

  const total = items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);

  const purchase = await Purchase.create({
    referenceNumber: generateCode("PO"),
    supplierId,
    items: items.map((item) => ({ ...item, total: item.quantity * item.unitCost })),
    total,
    status: status || "pending",
    expectedDate,
    notes,
  });

  await logAction(req, { action: "create", entity: "Purchase", entityId: purchase._id.toString() });
  await purchase.populate(["supplierId", "items.productId"]);
  res.status(201).json(purchase);
});

router.post("/:id/receive", async (req, res) => {
  const purchase = await Purchase.findById(req.params.id);
  if (!purchase) throw new HttpError(404, "Purchase not found");
  if (purchase.status === "received") {
    throw new HttpError(400, "Purchase has already been received");
  }

  for (const item of purchase.items) {
    const product = await Product.findById(item.productId);
    if (!product) continue;
    product.stock = (product.stock ?? 0) + item.quantity;
    // Keep cost price in sync with the latest purchase price.
    product.costPrice = item.unitCost;
    await product.save();

    await StockMovement.create({
      productId: product._id,
      type: "in",
      quantity: item.quantity,
      reason: "Purchase received",
      reference: purchase.referenceNumber,
    });
  }

  purchase.status = "received";
  purchase.receivedDate = new Date();
  await purchase.save();

  await logAction(req, {
    action: "receive",
    entity: "Purchase",
    entityId: purchase._id.toString(),
    details: `Received ${purchase.referenceNumber}`,
  });

  await purchase.populate(["supplierId", "items.productId"]);
  res.json(purchase);
});

export default router;
