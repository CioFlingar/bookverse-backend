// src/routes/adminRoutes.js
import express from "express";
import { admin } from "../middleware/adminMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";
import Book from "../models/Book.js";
import Order from "../models/Order.js";

const router = express.Router();

// GET /api/admin/stats
// Get dashboard metrics (Total Sales, Books Count)
router.get("/stats", protect, admin, async (req, res) => {
  try {
    const bookCount = await Book.countDocuments();
    const deliveredOrders = await Order.countDocuments({
      status: "Delivered",
    });

    const revenueResult = await Order.aggregate([
      { $match: { status: "Delivered" } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);

    const stats = {
      totalRevenue: revenueResult[0]?.total || 0,
      totalBooks: bookCount,
      activeReaders: deliveredOrders,
      inventoryValue: await calculateInventoryValue(),
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

// GET /api/admin/revenue-analytics
// Get revenue analytics with MTD and growth
router.get("/revenue-analytics", protect, admin, async (req, res) => {
  try {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    );
    const previousMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
    );

    const currentMonthRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: currentMonthStart, $lte: now },
          status: "Delivered",
        },
      },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);

    const previousMonthRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd },
          status: "Delivered",
        },
      },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);

    const mtdRevenue = currentMonthRevenue[0]?.total || 0;
    const previousMtdRevenue = previousMonthRevenue[0]?.total || 0;
    const growthPercentage =
      previousMtdRevenue > 0
        ? ((mtdRevenue - previousMtdRevenue) / previousMtdRevenue) * 100
        : 0;

    res.json({
      mtdRevenue,
      previousMtdRevenue,
      growthPercentage: parseFloat(growthPercentage.toFixed(2)),
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

// POST /api/admin/books
// Add new book
router.post("/books", protect, admin, async (req, res) => {
  try {
    const {
      title,
      author,
      price,
      category,
      description,
      stock,
      language,
      pageCount,
      releaseDate,
      publisher,
      genre,
    } = req.body;

    if (!title || !author || !price || !category) {
      return res.status(400).json({
        message: "Title, author, price, and category are required",
      });
    }

    const book = await Book.create({
      title,
      author,
      price,
      category,
      description,
      stock,
      language,
      pageCount,
      releaseDate,
      publisher,
      genre: genre || [],
    });

    res.status(201).json(book);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

// PUT /api/admin/books/:id
// Update book
router.put("/books/:id", protect, admin, async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.json(book);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

// DELETE /api/admin/books/:id
// Delete book
router.delete("/books/:id", protect, admin, async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.json({ message: "Book deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

// Helper function to calculate inventory value
async function calculateInventoryValue() {
  const result = await Book.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: { $multiply: ["$price", "$stock"] } },
      },
    },
  ]);

  return result[0]?.total || 0;
}

export default router;
