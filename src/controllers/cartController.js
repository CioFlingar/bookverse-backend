// src/controllers/cartController.js
import Book from "../models/Book.js";
import Cart from "../models/Cart.js";

// Get user's cart
export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.book",
    );
    if (!cart) {
      return res.json({ items: [], totalPrice: 0 });
    }
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching cart" });
  }
};

// Add item to cart
export const addToCart = async (req, res) => {
  try {
    const { bookId, quantity } = req.body;

    if (!bookId || !quantity || quantity < 1) {
      return res.status(400).json({ message: "Invalid bookId or quantity" });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (book.stock < quantity) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    const existingItem = cart.items.find((item) => item.book.equals(bookId));
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ book: bookId, quantity, price: book.price });
    }

    cart.totalPrice = cart.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
    await cart.save();

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: "Server error adding to cart" });
  }
};

// Update cart item quantity
export const updateCartItem = async (req, res) => {
  try {
    const { bookId, quantity } = req.body;

    if (!bookId || quantity < 0) {
      return res.status(400).json({ message: "Invalid bookId or quantity" });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const item = cart.items.find((item) => item.book.equals(bookId));
    if (!item) {
      return res.status(404).json({ message: "Item not in cart" });
    }

    if (quantity === 0) {
      cart.items = cart.items.filter((item) => !item.book.equals(bookId));
    } else {
      item.quantity = quantity;
    }

    cart.totalPrice = cart.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
    await cart.save();

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: "Server error updating cart" });
  }
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    const { bookId } = req.body;

    if (!bookId) {
      return res.status(400).json({ message: "Invalid bookId" });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = cart.items.filter((item) => !item.book.equals(bookId));
    cart.totalPrice = cart.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
    await cart.save();

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: "Server error removing from cart" });
  }
};

// Clear cart
export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: "Server error clearing cart" });
  }
};
