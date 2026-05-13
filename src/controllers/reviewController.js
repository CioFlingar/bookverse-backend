// src/controllers/reviewController.js
import Book from "../models/Book.js";
import Order from "../models/Order.js";
import Review from "../models/Review.js";
import mongoose from "mongoose";

// Check if user purchased the book
const checkVerifiedPurchase = async (userId, bookId) => {
  const order = await Order.findOne({
    user: userId,
    "items.book": bookId,
    status: "Delivered",
  });
  return !!order;
};

// Create review
export const createReview = async (req, res) => {
  try {
    const { bookId, rating, comment } = req.body;
    const numericRating = Number(rating);

    if (!bookId || !Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: "Invalid rating or bookId" });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Check for existing review
    const existingReview = await Review.findOne({
      book: bookId,
      user: req.user._id,
    });
    if (existingReview) {
      return res
        .status(400)
        .json({ message: "You have already reviewed this book" });
    }

    const verifiedPurchase = await checkVerifiedPurchase(req.user._id, bookId);

    const review = await Review.create({
      book: bookId,
      user: req.user._id,
      rating: numericRating,
      comment,
      verifiedPurchase,
    });

    // Update book rating
    await updateBookRating(bookId);

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: "Server error creating review" });
  }
};

// Get reviews for a book
export const getBookReviews = async (req, res) => {
  try {
    const { bookId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 10;
    const skip = (pageNum - 1) * pageSize;

    const reviews = await Review.find({ book: bookId })
      .populate("user", "name")
      .sort({ verifiedPurchase: -1, helpfulCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    const total = await Review.countDocuments({ book: bookId });

    res.json({
      reviews,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        pages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error fetching reviews" });
  }
};

// Update review
export const updateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const numericRating = rating === undefined ? undefined : Number(rating);

    if (
      numericRating !== undefined &&
      (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5)
    ) {
      return res.status(400).json({ message: "Invalid rating" });
    }

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (!review.user.equals(req.user._id)) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this review" });
    }

    if (numericRating !== undefined) review.rating = numericRating;
    if (comment !== undefined) review.comment = comment;

    await review.save();

    // Update book rating
    await updateBookRating(review.book);

    res.json(review);
  } catch (error) {
    res.status(500).json({ message: "Server error updating review" });
  }
};

// Delete review
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (!review.user.equals(req.user._id)) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this review" });
    }

    const bookId = review.book;
    await Review.findByIdAndDelete(req.params.id);

    // Update book rating
    await updateBookRating(bookId);

    res.json({ message: "Review deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error deleting review" });
  }
};

// Mark review as helpful
export const markHelpful = async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { $inc: { helpfulCount: 1 } },
      { new: true },
    );

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.json(review);
  } catch (error) {
    res.status(500).json({ message: "Server error marking helpful" });
  }
};

// Update book rating based on all reviews
const updateBookRating = async (bookId) => {
  try {
    const bookObjectId =
      typeof bookId === "string" ? new mongoose.Types.ObjectId(bookId) : bookId;

    const result = await Review.aggregate([
      { $match: { book: bookObjectId } },
      {
        $group: {
          _id: "$book",
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ]);

    if (result.length > 0) {
      await Book.findByIdAndUpdate(bookId, {
        rating: Math.round(result[0].avgRating * 10) / 10,
        reviewsCount: result[0].count,
      });
    } else {
      await Book.findByIdAndUpdate(bookId, {
        rating: 0,
        reviewsCount: 0,
      });
    }
  } catch (error) {
    console.error("Error updating book rating:", error);
  }
};
