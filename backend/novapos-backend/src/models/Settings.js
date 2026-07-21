import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    storeName: { type: String, default: "My Store" },
    currency: { type: String, default: "KES" },
    taxRate: { type: Number, default: 0 },
    receiptFooter: { type: String, default: "Thank you for shopping with us!" },
    lowStockThreshold: { type: Number, default: 5 },
    address: { type: String },
    phone: { type: String },
    email: { type: String },
  },
  { timestamps: true },
);

// Singleton helper — there's always exactly one settings document.
settingsSchema.statics.getSingleton = async function getSingleton() {
  let doc = await this.findOne();
  if (!doc) doc = await this.create({});
  return doc;
};

export default mongoose.model("Settings", settingsSchema);