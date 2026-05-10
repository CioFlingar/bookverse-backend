// src/routes/userRoutes.js

import express from "express";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get logged in user data
router.get("/profile", protect, async (req, res) => {
  // Since we used protect, req.user is already populated
  res.json(req.user);
});

export default router;
