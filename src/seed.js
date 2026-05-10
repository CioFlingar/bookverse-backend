// src/seed.js
import dotenv from "dotenv";
import mongoose from "mongoose";
import Book from "./models/Book.js";

dotenv.config();

const books = [
  {
    title: "The Silent Archival of Lost Echoes",
    author: "Elena Sterling",
    description:
      "A hauntingly beautiful exploration of memory and the objects we leave behind.",
    price: 35.0,
    category: "Historical Fiction",
    imageColor: "bg-verse-dark",
    rating: 4.9,
    reviewsCount: 850,
  },
  {
    title: "The Glass Kingdom",
    author: "Lawrence Whitmore",
    description: "A deep dive into the transparency of modern society.",
    price: 28.0,
    category: "Historical Fiction",
    imageColor: "bg-blue-900",
  },
  {
    title: "Notes on Gravity",
    author: "Dr. Sarah Vance",
    description: "Scientific perspectives on the forces that pull us together.",
    price: 32.0,
    category: "Science",
    imageColor: "bg-teal-800",
  },
  {
    title: "The Echoes of Silence",
    author: "Evelyn Thorne",
    description: "A hidden manuscript unearths letters that rewrite history.",
    price: 32.5,
    category: "Historical Fiction",
    imageColor: "bg-black",
  },
];

const importData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Book.deleteMany(); // Clear existing data
    await Book.insertMany(books);
    console.log("Data Imported Successfully!");
    process.exit();
  } catch (err) {
    console.error(`${err}`);
    process.exit(1);
  }
};

importData();
