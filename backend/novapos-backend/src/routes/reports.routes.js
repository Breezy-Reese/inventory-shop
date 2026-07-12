import { Router } from "express";
import Sale from "../models/Sale.js";
import Product from "../models/Product.js";
import Customer from "../models/Customer.js";
import Expense from "../models/Expense.js";
import { dateRange } from "../utils/helpers.js";

const router = Router();

function startOfDay(d) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}
function startOfMonth(d) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

router.get("/summary", async (_req, res) => {
  const now = new Date();
  const todayStart = startOfDay(now);
  const monthStart = startOfMonth(now);

  const [todayAgg] = await Sale.aggregate([
    { $match: { createdAt: { $gte: todayStart }, status: { $ne: "void" } } },
    { $group: { _id: null, revenue: { $sum: "$total" }, count: { $sum: 1 } } },
  ]);

  const [monthAgg] = await Sale.aggregate([
    { $match: { createdAt: { $gte: monthStart }, status: { $ne: "void" } } },
    { $group: { _id: null, revenue: { $sum: "$total" } } },
  ]);

  const revenueByDayAgg = await Sale.aggregate([
    { $match: { createdAt: { $gte: new Date(Date.now() - 13 * 86400000) }, status: { $ne: "void" } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$total" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const topProductsAgg = await Sale.aggregate([
    { $match: { status: { $ne: "void" } } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.name",
        quantity: { $sum: "$items.quantity" },
        revenue: { $sum: "$items.total" },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 5 },
  ]);

  const totalProducts = await Product.countDocuments();
  const lowStockCount = await Product.countDocuments({
    $expr: { $lte: ["$stock", "$lowStockThreshold"] },
  });
  const totalCustomers = await Customer.countDocuments();

  res.json({
    todayRevenue: todayAgg?.revenue ?? 0,
    todaySalesCount: todayAgg?.count ?? 0,
    monthRevenue: monthAgg?.revenue ?? 0,
    totalProducts,
    lowStockCount,
    totalCustomers,
    revenueByDay: revenueByDayAgg.map((d) => ({ date: d._id, revenue: d.revenue, orders: d.orders })),
    topProducts: topProductsAgg.map((p) => ({ name: p._id, quantity: p.quantity, revenue: p.revenue })),
  });
});

router.get("/sales", async (req, res) => {
  const { from, to } = dateRange(req.query);
  const agg = await Sale.aggregate([
    { $match: { createdAt: { $gte: from, $lte: to }, status: { $ne: "void" } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$total" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  res.json(agg.map((d) => ({ date: d._id, revenue: d.revenue, orders: d.orders })));
});

router.get("/profit", async (req, res) => {
  const { from, to } = dateRange(req.query);
  const agg = await Sale.aggregate([
    { $match: { createdAt: { $gte: from, $lte: to }, status: { $ne: "void" } } },
    { $unwind: "$items" },
    {
      $lookup: {
        from: "products",
        localField: "items.productId",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$items.total" },
        cost: {
          $sum: { $multiply: ["$items.quantity", { $ifNull: ["$product.costPrice", 0] }] },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  res.json(
    agg.map((d) => ({ date: d._id, revenue: d.revenue, cost: d.cost, profit: d.revenue - d.cost })),
  );
});

router.get("/inventory", async (_req, res) => {
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

router.get("/expenses", async (req, res) => {
  const { from, to } = dateRange(req.query);
  const expenses = await Expense.find({ createdAt: { $gte: from, $lte: to } }).sort({
    createdAt: -1,
  });
  res.json(expenses);
});

export default router;
