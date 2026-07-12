import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcryptjs";
import { connectDB } from "./db.js";
import User from "./models/User.js";
import Category from "./models/Category.js";
import Product from "./models/Product.js";
import Supplier from "./models/Supplier.js";
import Customer from "./models/Customer.js";
import Settings from "./models/Settings.js";

async function seed() {
  await connectDB();

  console.log("[seed] clearing existing data...");
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    Supplier.deleteMany({}),
    Customer.deleteMany({}),
    Settings.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash("password123", 10);
  await User.create({
    name: "Admin User",
    email: "admin@novapos.dev",
    passwordHash,
    role: "admin",
  });

  const [electronics, grocery, apparel] = await Category.create([
    { name: "Electronics", description: "Gadgets and accessories" },
    { name: "Grocery", description: "Everyday food items" },
    { name: "Apparel", description: "Clothing and accessories" },
  ]);

  const supplier = await Supplier.create({
    name: "Acme Wholesale",
    contactPerson: "Jane Doe",
    email: "sales@acmewholesale.com",
    phone: "+1-555-0100",
    address: "123 Supply Rd",
  });

  await Product.create([
    {
      name: "Wireless Mouse",
      sku: "ELEC-001",
      barcode: "0100000000011",
      categoryId: electronics._id,
      costPrice: 8,
      sellingPrice: 19.99,
      taxRate: 8,
      unit: "unit",
      stock: 42,
      lowStockThreshold: 10,
    },
    {
      name: "USB-C Cable 1m",
      sku: "ELEC-002",
      barcode: "0100000000028",
      categoryId: electronics._id,
      costPrice: 2.5,
      sellingPrice: 7.99,
      taxRate: 8,
      unit: "unit",
      stock: 120,
      lowStockThreshold: 20,
    },
    {
      name: "Basmati Rice 5kg",
      sku: "GRO-001",
      barcode: "0100000000035",
      categoryId: grocery._id,
      costPrice: 6,
      sellingPrice: 11.5,
      taxRate: 0,
      unit: "bag",
      stock: 8,
      lowStockThreshold: 10,
    },
    {
      name: "Cotton T-Shirt",
      sku: "APP-001",
      barcode: "0100000000042",
      categoryId: apparel._id,
      costPrice: 4,
      sellingPrice: 12.99,
      taxRate: 8,
      unit: "unit",
      stock: 60,
      lowStockThreshold: 15,
    },
  ]);

  await Customer.create([
    { name: "Walk-in Customer" },
    { name: "John Smith", email: "john@example.com", phone: "+1-555-0111" },
  ]);

  await Settings.create({
    storeName: "NovaPOS Demo Store",
    currency: "USD",
    taxRate: 8,
    receiptFooter: "Thank you for shopping with us!",
    lowStockThreshold: 10,
  });

  console.log("[seed] done. Log in with admin@novapos.dev / password123");
  console.log(`[seed] created supplier: ${supplier.name}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("[seed] failed", err);
  process.exit(1);
});
