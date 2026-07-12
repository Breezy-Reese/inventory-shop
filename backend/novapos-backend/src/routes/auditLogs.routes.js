import { Router } from "express";
import AuditLog from "../models/AuditLog.js";

const router = Router();

router.get("/", async (_req, res) => {
  const logs = await AuditLog.find().populate("userId").sort({ createdAt: -1 }).limit(500);
  res.json(logs);
});

export default router;
