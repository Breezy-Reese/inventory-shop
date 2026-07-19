import mongoose from "mongoose";

const saleItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    sku: { type: String },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
  },
  { _id: false },
);

const saleSchema = new mongoose.Schema(
  {
    receiptNumber: { type: String, unique: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    items: { type: [saleItemSchema], required: true, validate: (v) => v.length > 0 },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "mobile", "credit", "online"],
      required: true,
    },
    status: { type: String, enum: ["completed", "refunded", "void"], default: "completed" },
    cashierId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export default mongoose.model("Sale", saleSchema);
