// src/routes/bookRoutes.js
import express from "express";
import Book from "../models/Book.js";

const router = express.Router();

// GET /api/books
// Get all books for the catalog with search, filter, and sort
router.get("/", async (req, res) => {
  try {
    const {
      search,
      genre,
      author,
      minPrice,
      maxPrice,
      minRating,
      sort = "createdAt",
      page = 1,
      limit = 20,
    } = req.query;

    // Build filter object
    const filter = {};

    if (search) {
      filter.$text = { $search: search };
    }
    if (genre) {
      filter.genre = genre;
    }
    if (author) {
      filter.author = new RegExp(author, "i");
    }
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    if (minRating) {
      filter.rating = { $gte: parseFloat(minRating) };
    }

    // Build sort object
    const sortOptions = {};
    const sortField =
      sort === "price"
        ? "price"
        : sort === "rating"
          ? "rating"
          : sort === "title"
            ? "title"
            : "createdAt";
    sortOptions[sortField] = sort.startsWith("-") ? -1 : 1;

    // Pagination
    const pageNum = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 20;
    const skip = (pageNum - 1) * pageSize;

    const books = await Book.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize);

    const total = await Book.countDocuments(filter);

    res.json({
      books,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        pages: Math.ceil(total / pageSize),
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error fetching catalog" });
  }
});

// GET /api/books/low-stock
// Get books with low stock (stock <= 3)
router.get("/low-stock", async (req, res) => {
  try {
    const lowStockBooks = await Book.find({ stock: { $lte: 3 } }).sort({
      stock: 1,
    });
    res.json(lowStockBooks);
  } catch (err) {
    res.status(500).json({ message: "Server Error fetching low stock books" });
  }
});

// @route   GET /api/books/:id
router.get("/:id", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;
