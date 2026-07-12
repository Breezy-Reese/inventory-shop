import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { HttpError } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { logAction } from "../utils/helpers.js";

const router = Router();

function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

router.post("/register", async (req, res) => {
  const { name, email, password, role, branchId } = req.body;
  if (!name || !email || !password) {
    throw new HttpError(400, "name, email and password are required");
  }
  if (password.length < 6) {
    throw new HttpError(400, "Password must be at least 6 characters");
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new HttpError(409, "An account with that email already exists");
  }

  // First user ever created becomes admin; everyone after defaults to cashier.
  const userCount = await User.countDocuments();
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    passwordHash,
    role: userCount === 0 ? "admin" : role || "cashier",
    branchId,
  });

  const token = signToken(user);
  res.status(201).json({ token, user: user.toPublicJSON() });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new HttpError(400, "email and password are required");
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new HttpError(401, "Invalid email or password");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new HttpError(401, "Invalid email or password");
  }

  const token = signToken(user);
  await logAction(
    { user },
    { action: "login", entity: "User", entityId: user._id.toString(), details: `${user.email} signed in` },
  );
  res.json({ token, user: user.toPublicJSON() });
});

router.get("/me", requireAuth, async (req, res) => {
  res.json(req.user.toPublicJSON());
});

export default router;
