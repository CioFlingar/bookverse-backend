// src/controllers/quoteController.js
import Quote from "../models/Quote.js";

// Get random quote
export const getRandomQuote = async (req, res) => {
  try {
    const count = await Quote.countDocuments();
    if (count === 0) {
      return res.json({ message: "No quotes available" });
    }

    const random = Math.floor(Math.random() * count);
    const quote = await Quote.findOne().skip(random).populate("book");

    res.json(quote);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching quote" });
  }
};

// Get quotes by book
export const getQuotesByBook = async (req, res) => {
  try {
    const { bookId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 10;
    const skip = (pageNum - 1) * pageSize;

    const quotes = await Quote.find({ book: bookId })
      .skip(skip)
      .limit(pageSize);

    const total = await Quote.countDocuments({ book: bookId });

    res.json({
      quotes,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        pages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error fetching quotes" });
  }
};

// Get all quotes
export const getAllQuotes = async (req, res) => {
  try {
    const { author, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (author) {
      filter.author = new RegExp(author, "i");
    }

    const pageNum = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 20;
    const skip = (pageNum - 1) * pageSize;

    const quotes = await Quote.find(filter)
      .populate("book")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    const total = await Quote.countDocuments(filter);

    res.json({
      quotes,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        pages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error fetching quotes" });
  }
};

// Create quote (admin only)
export const createQuote = async (req, res) => {
  try {
    const { text, author, bookId } = req.body;

    if (!text || !author) {
      return res.status(400).json({ message: "Text and author are required" });
    }

    const quote = await Quote.create({
      text,
      author,
      book: bookId,
    });

    res.status(201).json(quote);
  } catch (error) {
    res.status(500).json({ message: "Server error creating quote" });
  }
};

// Delete quote (admin only)
export const deleteQuote = async (req, res) => {
  try {
    const quote = await Quote.findByIdAndDelete(req.params.id);
    if (!quote) {
      return res.status(404).json({ message: "Quote not found" });
    }

    res.json({ message: "Quote deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error deleting quote" });
  }
};
