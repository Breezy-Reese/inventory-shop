import { Router } from "express";
import Order from "../models/Order.js";
import Sale from "../models/Sale.js";
import Product from "../models/Product.js";
import StockMovement from "../models/StockMovement.js";
import { HttpError } from "../middleware/errorHandler.js";
import { generateCode, logAction } from "../utils/helpers.js";

const router = Router();

router.get("/", async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const orders = await Order.find(filter).populate("items.productId").sort({ createdAt: -1 });
  res.json(orders);
});

router.get("/:id", async (req, res) => {
  const order = await Order.findById(req.params.id).populate("items.productId");
  if (!order) throw new HttpError(404, "Order not found");
  res.json(order);
});

router.put("/:id/status", async (req, res) => {
  const { status } = req.body;
  const validStatuses = ["pending", "confirmed", "fulfilled", "cancelled"];
  if (!validStatuses.includes(status)) {
    throw new HttpError(400, `status must be one of: ${validStatuses.join(", ")}`);
  }

  const order = await Order.findById(req.params.id);
  if (!order) throw new HttpError(404, "Order not found");

  if (order.status === status) {
    return res.json(order); // no-op, avoids double-applying side effects
  }
  if (["fulfilled", "cancelled"].includes(order.status)) {
    throw new HttpError(400, `Order is already ${order.status} and can't be changed`);
  }

  if (status === "cancelled") {
    // Release the stock that was reserved when the order was placed.
    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (!product) continue;
      product.stock = (product.stock ?? 0) + item.quantity;
      await product.save();
      await StockMovement.create({
        productId: product._id,
        type: "in",
        quantity: item.quantity,
        reason: "Online order cancelled",
        reference: order.orderNumber,
      });
    }
  }

  if (status === "fulfilled") {
    // Mirror the order into a Sale so it shows up in revenue reports
    // alongside in-store transactions. Stock was already decremented
    // when the order was placed, so we don't touch it again here.
    const sale = await Sale.create({
      receiptNumber: generateCode("RCT"),
      items: order.items,
      subtotal: order.subtotal,
      discount: 0,
      tax: order.tax,
      total: order.total,
      paymentMethod: "online",
      cashierId: req.user._id,
    });
    order.linkedSaleId = sale._id;
  }

  order.status = status;
  await order.save();

  await logAction(req, {
    action: "update_status",
    entity: "Order",
    entityId: order._id.toString(),
    details: `${order.orderNumber} -> ${status}`,
  });

  res.json(order);
});

export default router;
