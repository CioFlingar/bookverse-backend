// src/routes/authRoutes.js

import express from "express";
import {
  changePassword,
  getUserProfile,
  loginUser,
  registerUser,
  updateUserProfile,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);
router.post("/change-password", protect, changePassword);

export default router;
