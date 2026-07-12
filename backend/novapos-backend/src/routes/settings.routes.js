import { Router } from "express";
import Settings from "../models/Settings.js";
import { logAction } from "../utils/helpers.js";

const router = Router();

router.get("/", async (_req, res) => {
  const settings = await Settings.getSingleton();
  res.json(settings);
});

router.put("/", async (req, res) => {
  const settings = await Settings.getSingleton();
  Object.assign(settings, req.body);
  await settings.save();
  await logAction(req, { action: "update", entity: "Settings", entityId: settings._id.toString() });
  res.json(settings);
});

export default router;
