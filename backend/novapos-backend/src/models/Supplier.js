import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    contactPerson: { type: String },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
  },
  { timestamps: true },
);

export default mongoose.model("Supplier", supplierSchema);
