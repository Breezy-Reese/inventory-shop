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
  try {
    await connectDB();

    console.log("[seed] Clearing database...");

    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Supplier.deleteMany({}),
      Customer.deleteMany({}),
      Settings.deleteMany({}),
    ]);

    // =========================
    // ADMIN USER
    // =========================

    const passwordHash = await bcrypt.hash("password123", 10);

    await User.create({
      name: "Admin User",
      email: "admin@novapos.dev",
      passwordHash,
      role: "admin",
    });

    // =========================
    // CATEGORIES
    // =========================

    const [
      electronics,
      grocery,
      apparel,
      beverages,
      computers,
      phones,
      beauty,
      stationery,
      home,
    ] = await Category.create([
      {
        name: "Electronics",
        description: "Electronic devices and accessories",
      },
      {
        name: "Grocery",
        description: "Food and household items",
      },
      {
        name: "Apparel",
        description: "Clothing and fashion",
      },
      {
        name: "Beverages",
        description: "Soft drinks and juices",
      },
      {
        name: "Computers",
        description: "Computers and accessories",
      },
      {
        name: "Phones",
        description: "Smartphones and accessories",
      },
      {
        name: "Beauty",
        description: "Beauty and personal care",
      },
      {
        name: "Stationery",
        description: "Office and school supplies",
      },
      {
        name: "Home",
        description: "Home essentials",
      },
    ]);

    // =========================
    // SUPPLIER
    // =========================

    const supplier = await Supplier.create({
      name: "Acme Wholesale",
      contactPerson: "Jane Doe",
      email: "sales@acmewholesale.com",
      phone: "+1-555-0100",
      address: "123 Supply Road",
    });

    // =========================
    // PRODUCTS
    // =========================

    await Product.create([
      // =========================
      // ELECTRONICS
      // =========================
      {
        name: "Wireless Mouse",
        sku: "ELEC-001",
        barcode: "100000000001",
        categoryId: electronics._id,
        costPrice: 800,
        sellingPrice: 1500,
        taxRate: 8,
        unit: "unit",
        stock: 42,
        lowStockThreshold: 10,
        imageUrl: "https://picsum.photos/seed/mouse/400/400",
      },
      {
        name: "USB-C Cable 1m",
        sku: "ELEC-002",
        barcode: "100000000002",
        categoryId: electronics._id,
        costPrice: 250,
        sellingPrice: 600,
        taxRate: 8,
        unit: "unit",
        stock: 120,
        lowStockThreshold: 20,
        imageUrl: "https://picsum.photos/seed/usbcable/400/400",
      },
      {
        name: "Mechanical Keyboard",
        sku: "ELEC-003",
        barcode: "100000000003",
        categoryId: electronics._id,
        costPrice: 2500,
        sellingPrice: 5500,
        taxRate: 8,
        unit: "unit",
        stock: 30,
        lowStockThreshold: 8,
        imageUrl: "https://picsum.photos/seed/keyboard/400/400",
      },
      {
        name: "Gaming Headset",
        sku: "ELEC-004",
        barcode: "100000000004",
        categoryId: electronics._id,
        costPrice: 3000,
        sellingPrice: 6500,
        taxRate: 8,
        unit: "unit",
        stock: 18,
        lowStockThreshold: 5,
        imageUrl: "https://picsum.photos/seed/headset/400/400",
      },
      {
        name: "Power Bank 20000mAh",
        sku: "ELEC-005",
        barcode: "100000000005",
        categoryId: electronics._id,
        costPrice: 1800,
        sellingPrice: 3500,
        taxRate: 8,
        unit: "unit",
        stock: 35,
        lowStockThreshold: 10,
        imageUrl: "https://picsum.photos/seed/powerbank/400/400",
      },

      // =========================
      // GROCERY
      // =========================
      {
        name: "Basmati Rice 5kg",
        sku: "GRO-001",
        barcode: "200000000001",
        categoryId: grocery._id,
        costPrice: 800,
        sellingPrice: 1200,
        taxRate: 0,
        unit: "bag",
        stock: 25,
        lowStockThreshold: 10,
        imageUrl: "https://picsum.photos/seed/rice/400/400",
      },
      {
        name: "Cooking Oil 2L",
        sku: "GRO-002",
        barcode: "200000000002",
        categoryId: grocery._id,
        costPrice: 350,
        sellingPrice: 520,
        taxRate: 0,
        unit: "bottle",
        stock: 60,
        lowStockThreshold: 15,
        imageUrl: "https://picsum.photos/seed/oil/400/400",
      },
      {
        name: "Sugar 2kg",
        sku: "GRO-003",
        barcode: "200000000003",
        categoryId: grocery._id,
        costPrice: 220,
        sellingPrice: 320,
        taxRate: 0,
        unit: "packet",
        stock: 80,
        lowStockThreshold: 20,
        imageUrl: "https://picsum.photos/seed/sugar/400/400",
      },
      {
        name: "Milk 500ml",
        sku: "GRO-004",
        barcode: "200000000004",
        categoryId: grocery._id,
        costPrice: 45,
        sellingPrice: 70,
        taxRate: 0,
        unit: "packet",
        stock: 100,
        lowStockThreshold: 20,
        imageUrl: "https://picsum.photos/seed/milk/400/400",
      },
      {
        name: "Bread Loaf",
        sku: "GRO-005",
        barcode: "200000000005",
        categoryId: grocery._id,
        costPrice: 40,
        sellingPrice: 65,
        taxRate: 0,
        unit: "piece",
        stock: 55,
        lowStockThreshold: 10,
        imageUrl: "https://picsum.photos/seed/bread/400/400",
      },

      // =========================
      // BEVERAGES
      // =========================
      {
        name: "Coca-Cola 500ml",
        sku: "BEV-001",
        barcode: "300000000001",
        categoryId: beverages._id,
        costPrice: 45,
        sellingPrice: 80,
        taxRate: 8,
        unit: "bottle",
        stock: 200,
        lowStockThreshold: 30,
        imageUrl: "https://picsum.photos/seed/cocacola/400/400",
      },
      {
        name: "Fanta Orange 500ml",
        sku: "BEV-002",
        barcode: "300000000002",
        categoryId: beverages._id,
        costPrice: 45,
        sellingPrice: 80,
        taxRate: 8,
        unit: "bottle",
        stock: 180,
        lowStockThreshold: 30,
        imageUrl: "https://picsum.photos/seed/fanta/400/400",
      },
      {
        name: "Sprite 500ml",
        sku: "BEV-003",
        barcode: "300000000003",
        categoryId: beverages._id,
        costPrice: 45,
        sellingPrice: 80,
        taxRate: 8,
        unit: "bottle",
        stock: 170,
        lowStockThreshold: 30,
        imageUrl: "https://picsum.photos/seed/sprite/400/400",
      },
      {
        name: "Minute Maid Mango",
        sku: "BEV-004",
        barcode: "300000000004",
        categoryId: beverages._id,
        costPrice: 70,
        sellingPrice: 120,
        taxRate: 8,
        unit: "bottle",
        stock: 90,
        lowStockThreshold: 20,
        imageUrl: "https://picsum.photos/seed/juice/400/400",
      },
      {
        name: "Dasani Water 1L",
        sku: "BEV-005",
        barcode: "300000000005",
        categoryId: beverages._id,
        costPrice: 30,
        sellingPrice: 60,
        taxRate: 8,
        unit: "bottle",
        stock: 150,
        lowStockThreshold: 25,
        imageUrl: "https://picsum.photos/seed/water/400/400",
      },

      // =========================
      // APPAREL
      // =========================
      {
        name: "Cotton T-Shirt",
        sku: "APP-001",
        barcode: "400000000001",
        categoryId: apparel._id,
        costPrice: 600,
        sellingPrice: 1200,
        taxRate: 8,
        unit: "unit",
        stock: 60,
        lowStockThreshold: 15,
        imageUrl: "https://picsum.photos/seed/tshirt/400/400",
      },
      {
        name: "Men's Jeans",
        sku: "APP-002",
        barcode: "400000000002",
        categoryId: apparel._id,
        costPrice: 1200,
        sellingPrice: 2500,
        taxRate: 8,
        unit: "unit",
        stock: 35,
        lowStockThreshold: 10,
        imageUrl: "https://picsum.photos/seed/jeans/400/400",
      },
      {
        name: "Hoodie",
        sku: "APP-003",
        barcode: "400000000003",
        categoryId: apparel._id,
        costPrice: 1500,
        sellingPrice: 3000,
        taxRate: 8,
        unit: "unit",
        stock: 20,
        lowStockThreshold: 8,
        imageUrl: "https://picsum.photos/seed/hoodie/400/400",
      },
      {
        name: "Sneakers",
        sku: "APP-004",
        barcode: "400000000004",
        categoryId: apparel._id,
        costPrice: 2500,
        sellingPrice: 5500,
        taxRate: 8,
        unit: "pair",
        stock: 28,
        lowStockThreshold: 10,
        imageUrl: "https://picsum.photos/seed/sneakers/400/400",
      },
      {
        name: "Baseball Cap",
        sku: "APP-005",
        barcode: "400000000005",
        categoryId: apparel._id,
        costPrice: 300,
        sellingPrice: 800,
        taxRate: 8,
        unit: "unit",
        stock: 75,
        lowStockThreshold: 20,
        imageUrl: "https://picsum.photos/seed/cap/400/400",
      },

      // =========================
      // PHONES
      // =========================
      {
        name: "Samsung Galaxy A16",
        sku: "PHN-001",
        barcode: "500000000001",
        categoryId: phones._id,
        costPrice: 18000,
        sellingPrice: 23500,
        taxRate: 8,
        unit: "unit",
        stock: 15,
        lowStockThreshold: 5,
        imageUrl: "https://picsum.photos/seed/samsung/400/400",
      },
      {
        name: "Redmi Note 14",
        sku: "PHN-002",
        barcode: "500000000002",
        categoryId: phones._id,
        costPrice: 21000,
        sellingPrice: 27000,
        taxRate: 8,
        unit: "unit",
        stock: 12,
        lowStockThreshold: 5,
        imageUrl: "https://picsum.photos/seed/redmi/400/400",
      },
      {
        name: "iPhone 13",
        sku: "PHN-003",
        barcode: "500000000003",
        categoryId: phones._id,
        costPrice: 65000,
        sellingPrice: 79000,
        taxRate: 8,
        unit: "unit",
        stock: 6,
        lowStockThreshold: 2,
        imageUrl: "https://picsum.photos/seed/iphone/400/400",
      },

      // =========================
      // COMPUTERS
      // =========================
      {
        name: "HP ProBook 450",
        sku: "COMP-001",
        barcode: "600000000001",
        categoryId: computers._id,
        costPrice: 62000,
        sellingPrice: 75000,
        taxRate: 8,
        unit: "unit",
        stock: 8,
        lowStockThreshold: 2,
        imageUrl: "https://picsum.photos/seed/hp/400/400",
      },
      {
        name: "Dell Latitude 5420",
        sku: "COMP-002",
        barcode: "600000000002",
        categoryId: computers._id,
        costPrice: 68000,
        sellingPrice: 82000,
        taxRate: 8,
        unit: "unit",
        stock: 6,
        lowStockThreshold: 2,
        imageUrl: "https://picsum.photos/seed/dell/400/400",
      },
      {
        name: "Logitech Webcam",
        sku: "COMP-003",
        barcode: "600000000003",
        categoryId: computers._id,
        costPrice: 3500,
        sellingPrice: 6000,
        taxRate: 8,
        unit: "unit",
        stock: 20,
        lowStockThreshold: 5,
        imageUrl: "https://picsum.photos/seed/webcam/400/400",
      },

      // =========================
      // BEAUTY
      // =========================
      {
        name: "Nivea Body Lotion",
        sku: "BEAUTY-001",
        barcode: "700000000001",
        categoryId: beauty._id,
        costPrice: 350,
        sellingPrice: 650,
        taxRate: 8,
        unit: "bottle",
        stock: 45,
        lowStockThreshold: 10,
        imageUrl: "https://picsum.photos/seed/nivea/400/400",
      },
      {
        name: "Colgate Toothpaste",
        sku: "BEAUTY-002",
        barcode: "700000000002",
        categoryId: beauty._id,
        costPrice: 120,
        sellingPrice: 220,
        taxRate: 8,
        unit: "tube",
        stock: 80,
        lowStockThreshold: 15,
        imageUrl: "https://picsum.photos/seed/colgate/400/400",
      },
      {
        name: "Dettol Soap",
        sku: "BEAUTY-003",
        barcode: "700000000003",
        categoryId: beauty._id,
        costPrice: 80,
        sellingPrice: 150,
        taxRate: 8,
        unit: "bar",
        stock: 100,
        lowStockThreshold: 20,
        imageUrl: "https://picsum.photos/seed/dettol/400/400",
      },

      // =========================
      // STATIONERY
      // =========================
      {
        name: "A4 Printing Paper",
        sku: "STAT-001",
        barcode: "800000000001",
        categoryId: stationery._id,
        costPrice: 450,
        sellingPrice: 700,
        taxRate: 8,
        unit: "ream",
        stock: 35,
        lowStockThreshold: 10,
        imageUrl: "https://picsum.photos/seed/paper/400/400",
      },
      {
        name: "Exercise Book",
        sku: "STAT-002",
        barcode: "800000000002",
        categoryId: stationery._id,
        costPrice: 40,
        sellingPrice: 80,
        taxRate: 8,
        unit: "book",
        stock: 200,
        lowStockThreshold: 50,
        imageUrl: "https://picsum.photos/seed/notebook/400/400",
      },
      {
        name: "Blue Ball Pen",
        sku: "STAT-003",
        barcode: "800000000003",
        categoryId: stationery._id,
        costPrice: 15,
        sellingPrice: 30,
        taxRate: 8,
        unit: "piece",
        stock: 500,
        lowStockThreshold: 100,
        imageUrl: "https://picsum.photos/seed/pen/400/400",
      },

      // =========================
      // HOME
      // =========================
      {
        name: "Plastic Bucket",
        sku: "HOME-001",
        barcode: "900000000001",
        categoryId: home._id,
        costPrice: 280,
        sellingPrice: 450,
        taxRate: 8,
        unit: "piece",
        stock: 40,
        lowStockThreshold: 10,
        imageUrl: "https://picsum.photos/seed/bucket/400/400",
      },
      {
        name: "Mop",
        sku: "HOME-002",
        barcode: "900000000002",
        categoryId: home._id,
        costPrice: 350,
        sellingPrice: 650,
        taxRate: 8,
        unit: "piece",
        stock: 25,
        lowStockThreshold: 5,
        imageUrl: "https://picsum.photos/seed/mop/400/400",
      },
      {
        name: "Dustbin",
        sku: "HOME-003",
        barcode: "900000000003",
        categoryId: home._id,
        costPrice: 500,
        sellingPrice: 900,
        taxRate: 8,
        unit: "piece",
        stock: 20,
        lowStockThreshold: 5,
        imageUrl: "https://picsum.photos/seed/dustbin/400/400",
      },
    ]);

    // =========================
    // CUSTOMERS
    // =========================

    await Customer.create([
      {
        name: "Walk-in Customer",
      },
      {
        name: "John Smith",
        email: "john@example.com",
        phone: "+1-555-0111",
      },
      {
        name: "Mary Wanjiku",
        email: "mary@example.com",
        phone: "+254712345678",
      },
    ]);

    // =========================
    // SETTINGS
    // =========================

    await Settings.create({
      storeName: "NovaPOS Demo Store",
      currency: "KES",
      taxRate: 8,
      receiptFooter: "Thank you for shopping with us!",
      lowStockThreshold: 10,
    });

    console.log("=====================================");
    console.log("✅ Database seeded successfully!");
    console.log("=====================================");
    console.log("Admin Email : admin@novapos.dev");
    console.log("Password    : password123");
    console.log("Store       : NovaPOS Demo Store");
    console.log("Categories  : 9");
    console.log("Products    : 29");
    console.log("Customers   : 3");
    console.log(`Supplier    : ${supplier.name}`);
    console.log("=====================================");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed");
    console.error(error);
    process.exit(1);
  }
}

seed();