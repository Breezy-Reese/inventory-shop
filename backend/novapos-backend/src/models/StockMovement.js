import mongoose from "mongoose";

const stockMovementSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    type: { type: String, enum: ["in", "out", "adjustment", "transfer"], required: true },
    quantity: { type: Number, required: true },
    reason: { type: String },
    reference: { type: String },
  },
  { timestamps: true },
);

export default mongoose.model("StockMovement", stockMovementSchema);
