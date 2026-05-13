// src/routes/quoteRoutes.js
import express from "express";
import {
  createQuote,
  deleteQuote,
  getAllQuotes,
  getQuotesByBook,
  getRandomQuote,
} from "../controllers/quoteController.js";
import { admin } from "../middleware/adminMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/random", getRandomQuote);
router.get("/", getAllQuotes);
router.get("/book/:bookId", getQuotesByBook);

// Admin routes
router.post("/", protect, admin, createQuote);
router.delete("/:id", protect, admin, deleteQuote);

export default router;
