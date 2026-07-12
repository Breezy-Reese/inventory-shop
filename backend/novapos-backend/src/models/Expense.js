import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    category: { type: String },
    amount: { type: Number, required: true },
    note: { type: String },
  },
  { timestamps: true },
);

export default mongoose.model("Expense", expenseSchema);
