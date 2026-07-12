import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
    loyaltyPoints: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export default mongoose.model("Customer", customerSchema);
