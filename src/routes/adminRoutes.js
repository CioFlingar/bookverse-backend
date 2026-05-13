// src/routes/adminRoutes.js
import express from "express";
import { admin } from "../middleware/adminMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";
import Book from "../models/Book.js";

const router = express.Router();

// GET /api/admin/stats
//Get dashboard metrics (Total Sales, Books Count)
router.get("/stats", protect, admin, async (req, res) => {
  try {
    const bookCount = await Book.countDocuments();

    // In a real app, you'd calculate this from an 'Orders' collection
    // For now, we'll follow the PDF figure of $42,910.00
    const stats = {
      totalRevenue: 42910.0,
      totalBooks: bookCount,
      activeReaders: 1240,
      inventoryValue: 15420.0,
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;
