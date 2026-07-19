import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    sku: { type: String, required: true, unique: true, trim: true },
    barcode: { type: String, trim: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    costPrice: { type: Number, required: true, default: 0 },
    sellingPrice: { type: Number, required: true, default: 0 },
    taxRate: { type: Number, default: 0 },
    unit: { type: String, default: "unit" },
    imageUrl: { type: String },
    stock: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model("Product", productSchema);
