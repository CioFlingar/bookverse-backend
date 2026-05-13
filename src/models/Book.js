// src/models/Book.js
import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, index: true },
    author: { type: String, required: true, index: true },
    description: { type: String },
    price: { type: Number, required: true },
    category: { type: String, required: true, index: true },
    imageColor: { type: String },
    stock: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewsCount: { type: Number, default: 0 },
    language: { type: String, default: "English" },
    pageCount: { type: Number },
    releaseDate: { type: Date },
    publisher: { type: String },
    genre: [{ type: String }],
  },
  { timestamps: true },
);

// Create text index for search
bookSchema.index({ title: "text", author: "text", description: "text" });

export default mongoose.model("Book", bookSchema);
