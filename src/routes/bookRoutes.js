// src/routes/bookRoutes.js
import express from "express";
import Book from "../models/Book.js";

const router = express.Router();

// GET /api/books
// Get all books for the catalog
router.get("/", async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: "Server Error fetching catalog" });
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
