import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true },
    entity: { type: String },
    entityId: { type: String },
    details: { type: String },
  },
  { timestamps: true },
);

export default mongoose.model("AuditLog", auditLogSchema);
