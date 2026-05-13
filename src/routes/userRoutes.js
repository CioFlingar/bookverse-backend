// src/routes/userRoutes.js

import express from "express";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Deprecated: profile now moved to auth routes
// Kept for backward compatibility
router.get("/profile", protect, async (req, res) => {
  res.json(req.user);
});

export default router;
