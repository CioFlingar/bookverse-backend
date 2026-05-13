// src/routes/reviewRoutes.js
import express from "express";
import {
  createReview,
  deleteReview,
  getBookReviews,
  markHelpful,
  updateReview,
} from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get reviews for a book (public)
router.get("/book/:bookId", getBookReviews);

// Protected routes
router.post("/", protect, createReview);
router.put("/:id", protect, updateReview);
router.delete("/:id", protect, deleteReview);
router.post("/:id/helpful", protect, markHelpful);

export default router;
