import Book from "../models/Book.js";
import Wishlist from "../models/Wishlist.js";

export const getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.find({ user: req.user._id })
      .populate("book")
      .sort({ createdAt: -1 });

    res.json({
      items: wishlist.filter((item) => item.book),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error fetching wishlist" });
  }
};

export const addToWishlist = async (req, res) => {
  try {
    const { bookId } = req.body;

    if (!bookId) {
      return res.status(400).json({ message: "Book ID is required" });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    await Wishlist.findOneAndUpdate(
      { user: req.user._id, book: bookId },
      { user: req.user._id, book: bookId },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    const wishlist = await Wishlist.find({ user: req.user._id })
      .populate("book")
      .sort({ createdAt: -1 });

    res.status(201).json({ items: wishlist });
  } catch (error) {
    res.status(500).json({ message: "Server error adding to wishlist" });
  }
};

export const removeFromWishlist = async (req, res) => {
  try {
    const { bookId } = req.params;

    await Wishlist.findOneAndDelete({ user: req.user._id, book: bookId });

    const wishlist = await Wishlist.find({ user: req.user._id })
      .populate("book")
      .sort({ createdAt: -1 });

    res.json({ items: wishlist });
  } catch (error) {
    res.status(500).json({ message: "Server error removing from wishlist" });
  }
};

export const clearWishlist = async (req, res) => {
  try {
    await Wishlist.deleteMany({ user: req.user._id });
    res.json({ items: [] });
  } catch (error) {
    res.status(500).json({ message: "Server error clearing wishlist" });
  }
};
