// src/models/Quote.js
import mongoose from "mongoose";

const quoteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    author: { type: String, required: true },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Quote", quoteSchema);
