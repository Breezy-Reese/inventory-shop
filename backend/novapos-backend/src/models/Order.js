import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    sku: { type: String },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerEmail: { type: String },
    deliveryAddress: { type: String },
    fulfillmentType: { type: String, enum: ["pickup", "delivery"], default: "pickup" },
    items: { type: [orderItemSchema], required: true, validate: (v) => v.length > 0 },
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "fulfilled", "cancelled"],
      default: "pending",
    },
    notes: { type: String },
    linkedSaleId: { type: mongoose.Schema.Types.ObjectId, ref: "Sale" },
  },
  { timestamps: true },
);

export default mongoose.model("Order", orderSchema);
