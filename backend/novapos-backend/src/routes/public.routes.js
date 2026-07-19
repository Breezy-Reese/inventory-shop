import { Router } from "express";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import Order from "../models/Order.js";
import StockMovement from "../models/StockMovement.js";
import { HttpError } from "../middleware/errorHandler.js";
import { generateCode, logAction } from "../utils/helpers.js";

const router = Router();

// Only the fields a customer should ever see — never expose cost price,
// low-stock thresholds, or exact internal stock counts.
function toPublicProduct(p) {
  return {
    _id: p._id,
    name: p.name,
    description: p.description,
    sku: p.sku,
    category: p.categoryId ? { _id: p.categoryId._id, name: p.categoryId.name } : null,
    price: p.sellingPrice,
    imageUrl: p.imageUrl,
    unit: p.unit,
    inStock: (p.stock ?? 0) > 0,
  };
}

router.get("/categories", async (_req, res) => {
  const categories = await Category.find().sort({ name: 1 }).select("name description");
  res.json(categories);
});

router.get("/products", async (req, res) => {
  const filter = { isActive: true };
  if (req.query.category) filter.categoryId = req.query.category;
  if (req.query.q) filter.name = { $regex: req.query.q, $options: "i" };

  const products = await Product.find(filter).populate("categoryId").sort({ name: 1 });
  res.json(products.map(toPublicProduct));
});

router.get("/products/:id", async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, isActive: true }).populate(
    "categoryId",
  );
  if (!product) throw new HttpError(404, "Product not found");
  res.json(toPublicProduct(product));
});

router.post("/orders", async (req, res) => {
  const { customerName, customerPhone, customerEmail, deliveryAddress, fulfillmentType, notes, items } =
    req.body;

  if (!customerName || !customerPhone) {
    throw new HttpError(400, "customerName and customerPhone are required");
  }
  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpError(400, "At least one item is required");
  }
  if (fulfillmentType === "delivery" && !deliveryAddress) {
    throw new HttpError(400, "deliveryAddress is required for delivery orders");
  }

  // Always price from the database — never trust prices sent by the client.
  const products = await Product.find({
    _id: { $in: items.map((i) => i.productId) },
    isActive: true,
  });
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  const orderItems = [];
  let subtotal = 0;
  let tax = 0;

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) throw new HttpError(404, `Product ${item.productId} not found`);
    const quantity = Number(item.quantity);
    if (!quantity || quantity < 1) throw new HttpError(400, `Invalid quantity for ${product.name}`);
    if ((product.stock ?? 0) < quantity) {
      throw new HttpError(400, `${product.name} is out of stock`);
    }

    const lineSubtotal = product.sellingPrice * quantity;
    const lineTax = lineSubtotal * ((product.taxRate ?? 0) / 100);
    subtotal += lineSubtotal;
    tax += lineTax;

    orderItems.push({
      productId: product._id,
      name: product.name,
      sku: product.sku,
      quantity,
      unitPrice: product.sellingPrice,
      total: lineSubtotal,
    });
  }

  const order = await Order.create({
    orderNumber: generateCode("ORD"),
    customerName,
    customerPhone,
    customerEmail,
    deliveryAddress,
    fulfillmentType: fulfillmentType || "pickup",
    items: orderItems,
    subtotal,
    tax,
    total: subtotal + tax,
    notes,
  });

  // Reserve stock immediately so two customers can't both "buy" the last unit.
  for (const item of orderItems) {
    const product = productMap.get(item.productId.toString());
    product.stock = (product.stock ?? 0) - item.quantity;
    await product.save();
    await StockMovement.create({
      productId: product._id,
      type: "out",
      quantity: item.quantity,
      reason: "Online order",
      reference: order.orderNumber,
    });
  }

  await logAction(
    { user: null },
    {
      action: "create",
      entity: "Order",
      entityId: order._id.toString(),
      details: `${order.orderNumber} placed online by ${customerName}`,
    },
  );

  res.status(201).json({
    orderNumber: order.orderNumber,
    status: order.status,
    total: order.total,
    items: order.items,
  });
});

// Lets a customer check their order status with the order number + phone
// they placed it with, without needing an account.
router.get("/orders/track", async (req, res) => {
  const { orderNumber, phone } = req.query;
  if (!orderNumber || !phone) {
    throw new HttpError(400, "orderNumber and phone are required");
  }
  const order = await Order.findOne({ orderNumber, customerPhone: phone });
  if (!order) throw new HttpError(404, "Order not found");
  res.json(order);
});

export default router;
