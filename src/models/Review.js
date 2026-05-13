// src/models/Review.js
import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    helpfulCount: { type: Number, default: 0 },
    verifiedPurchase: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Index to prevent duplicate reviews from same user
reviewSchema.index({ book: 1, user: 1 }, { unique: true });

export default mongoose.model("Review", reviewSchema);
