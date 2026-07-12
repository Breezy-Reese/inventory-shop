import { customAlphabet } from "nanoid";
import AuditLog from "../models/AuditLog.js";

const numeric = customAlphabet("0123456789", 6);

export function generateCode(prefix) {
  return `${prefix}-${numeric()}`;
}

export async function logAction(req, { action, entity, entityId, details }) {
  try {
    await AuditLog.create({
      userId: req.user?._id,
      action,
      entity,
      entityId,
      details,
    });
  } catch (err) {
    console.error("[audit] failed to log action", err.message);
  }
}

export function dateRange(query) {
  const from = query.from ? new Date(`${query.from}T00:00:00.000Z`) : new Date(0);
  const to = query.to ? new Date(`${query.to}T23:59:59.999Z`) : new Date();
  return { from, to };
}
