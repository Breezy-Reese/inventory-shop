import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "manager", "cashier"], default: "cashier" },
    branchId: { type: String },
  },
  { timestamps: true },
);

userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    branchId: this.branchId,
  };
};

export default mongoose.model("User", userSchema);
