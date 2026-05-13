// src/controllers/libraryController.js
import Book from "../models/Book.js";
import Library from "../models/Library.js";

// Add book to user's library
export const addToLibrary = async (req, res) => {
  try {
    const { bookId, status = "Owned" } = req.body;

    if (!bookId || !["Reading", "Completed", "Owned"].includes(status)) {
      return res.status(400).json({ message: "Invalid bookId or status" });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    let libraryEntry = await Library.findOne({
      user: req.user._id,
      book: bookId,
    });

    if (libraryEntry) {
      return res.status(400).json({ message: "Book already in your library" });
    }

    libraryEntry = await Library.create({
      user: req.user._id,
      book: bookId,
      status,
      totalPages: book.pageCount,
    });

    res.status(201).json(libraryEntry);
  } catch (error) {
    res.status(500).json({ message: "Server error adding to library" });
  }
};

// Get user's library
export const getUserLibrary = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    const filter = { user: req.user._id };
    if (status) filter.status = status;

    if (search) {
      const bookFilter = {
        $or: [
          { title: new RegExp(search, "i") },
          { author: new RegExp(search, "i") },
        ],
      };
      const books = await Book.find(bookFilter).select("_id");
      const bookIds = books.map((b) => b._id);
      filter.book = { $in: bookIds };
    }

    const pageNum = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 20;
    const skip = (pageNum - 1) * pageSize;

    const library = await Library.find(filter)
      .populate("book")
      .sort({ lastReadAt: -1, addedAt: -1 })
      .skip(skip)
      .limit(pageSize);

    const total = await Library.countDocuments(filter);

    res.json({
      books: library,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        pages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error fetching library" });
  }
};

// Update reading progress
export const updateProgress = async (req, res) => {
  try {
    const { bookId } = req.params;
    const { currentPage, status } = req.body;

    if (currentPage === undefined) {
      return res.status(400).json({ message: "currentPage is required" });
    }

    const libraryEntry = await Library.findOne({
      user: req.user._id,
      book: bookId,
    }).populate("book");

    if (!libraryEntry) {
      return res.status(404).json({ message: "Book not in library" });
    }

    libraryEntry.currentPage = currentPage;
    if (status) libraryEntry.status = status;
    libraryEntry.lastReadAt = new Date();

    if (libraryEntry.totalPages) {
      libraryEntry.percentComplete = Math.round(
        (currentPage / libraryEntry.totalPages) * 100,
      );
    }

    await libraryEntry.save();
    res.json(libraryEntry);
  } catch (error) {
    res.status(500).json({ message: "Server error updating progress" });
  }
};

// Update library entry status
export const updateLibraryStatus = async (req, res) => {
  try {
    const { bookId } = req.params;
    const { status } = req.body;

    if (!["Reading", "Completed", "Owned"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const libraryEntry = await Library.findOneAndUpdate(
      { user: req.user._id, book: bookId },
      { status },
      { new: true },
    ).populate("book");

    if (!libraryEntry) {
      return res.status(404).json({ message: "Book not in library" });
    }

    res.json(libraryEntry);
  } catch (error) {
    res.status(500).json({ message: "Server error updating status" });
  }
};

// Remove book from library
export const removeFromLibrary = async (req, res) => {
  try {
    const { bookId } = req.params;

    const result = await Library.findOneAndDelete({
      user: req.user._id,
      book: bookId,
    });

    if (!result) {
      return res.status(404).json({ message: "Book not in library" });
    }

    res.json({ message: "Book removed from library" });
  } catch (error) {
    res.status(500).json({ message: "Server error removing from library" });
  }
};

// Get reading statistics
export const getReadingStats = async (req, res) => {
  try {
    const stats = await Library.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: null,
          totalBooks: { $sum: 1 },
          reading: {
            $sum: { $cond: [{ $eq: ["$status", "Reading"] }, 1, 0] },
          },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] },
          },
          avgProgress: { $avg: "$percentComplete" },
        },
      },
    ]);

    res.json(
      stats[0] || {
        totalBooks: 0,
        reading: 0,
        completed: 0,
        avgProgress: 0,
      },
    );
  } catch (error) {
    res.status(500).json({ message: "Server error fetching stats" });
  }
};
