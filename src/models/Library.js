// src/models/Library.js
import mongoose from "mongoose";

const librarySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    status: {
      type: String,
      enum: ["Reading", "Completed", "Owned"],
      default: "Owned",
    },
    currentPage: { type: Number, default: 0 },
    totalPages: { type: Number },
    percentComplete: { type: Number, default: 0, min: 0, max: 100 },
    lastReadAt: { type: Date },
    addedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// Index to prevent duplicate entries
librarySchema.index({ user: 1, book: 1 }, { unique: true });

export default mongoose.model("Library", librarySchema);
