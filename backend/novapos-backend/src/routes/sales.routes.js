import { Router } from "express";
import Sale from "../models/Sale.js";
import Product from "../models/Product.js";
import Customer from "../models/Customer.js";
import StockMovement from "../models/StockMovement.js";
import { HttpError } from "../middleware/errorHandler.js";
import { generateCode, logAction } from "../utils/helpers.js";

const router = Router();

router.get("/", async (_req, res) => {
  const sales = await Sale.find()
    .populate("customerId")
    .populate("items.productId")
    .sort({ createdAt: -1 });
  res.json(sales);
});

router.post("/", async (req, res) => {
  const { customerId, items, subtotal, discount, tax, total, paymentMethod } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpError(400, "At least one line item is required");
  }
  if (!paymentMethod) {
    throw new HttpError(400, "paymentMethod is required");
  }

  // Validate stock availability before committing anything.
  const products = await Product.find({ _id: { $in: items.map((i) => i.productId) } });
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) throw new HttpError(404, `Product ${item.productId} not found`);
    if ((product.stock ?? 0) < item.quantity) {
      throw new HttpError(400, `Insufficient stock for ${product.name}`);
    }
  }

  const computedSubtotal =
    subtotal ?? items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const computedTotal = total ?? computedSubtotal - (discount ?? 0) + (tax ?? 0);

  const sale = await Sale.create({
    receiptNumber: generateCode("RCT"),
    customerId: customerId || undefined,
    items,
    subtotal: computedSubtotal,
    discount: discount ?? 0,
    tax: tax ?? 0,
    total: computedTotal,
    paymentMethod,
    cashierId: req.user._id,
  });

  // Decrement stock and record movements.
  for (const item of items) {
    const product = productMap.get(item.productId);
    product.stock = (product.stock ?? 0) - item.quantity;
    await product.save();
    await StockMovement.create({
      productId: product._id,
      type: "out",
      quantity: item.quantity,
      reason: "Sale",
      reference: sale.receiptNumber,
    });
  }

  // Update customer stats for account sales / loyalty.
  if (customerId) {
    await Customer.findByIdAndUpdate(customerId, {
      $inc: { totalSpent: computedTotal, loyaltyPoints: Math.floor(computedTotal) },
    });
  }

  await logAction(req, {
    action: "create",
    entity: "Sale",
    entityId: sale._id.toString(),
    details: `${sale.receiptNumber} — ${paymentMethod} — ${computedTotal}`,
  });

  await sale.populate(["customerId", "items.productId"]);
  res.status(201).json(sale);
});

export default router;
