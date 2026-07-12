import mongoose from "mongoose";

const purchaseItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String },
    quantity: { type: Number, required: true },
    unitCost: { type: Number, required: true },
    total: { type: Number },
  },
  { _id: false },
);

const purchaseSchema = new mongoose.Schema(
  {
    referenceNumber: { type: String, unique: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true },
    items: { type: [purchaseItemSchema], required: true, validate: (v) => v.length > 0 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "ordered", "received", "cancelled"],
      default: "pending",
    },
    expectedDate: { type: Date },
    receivedDate: { type: Date },
    notes: { type: String },
  },
  { timestamps: true },
);

export default mongoose.model("Purchase", purchaseSchema);
