// src/controllers/cartController.js
import Book from "../models/Book.js";
import Cart from "../models/Cart.js";

const populateCart = (cart) => cart.populate("items.book");

const calculateTotalPrice = (items) =>
  items.reduce((total, item) => total + item.price * item.quantity, 0);

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
    const requestedQuantity = Number(quantity);

    if (!bookId || !Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
      return res.status(400).json({ message: "Invalid bookId or quantity" });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (book.stock < requestedQuantity) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    const existingItem = cart.items.find((item) => item.book.equals(bookId));
    if (existingItem) {
      if (book.stock < existingItem.quantity + requestedQuantity) {
        return res.status(400).json({ message: "Insufficient stock" });
      }
      existingItem.quantity += requestedQuantity;
      existingItem.price = book.price;
    } else {
      cart.items.push({ book: bookId, quantity: requestedQuantity, price: book.price });
    }

    cart.totalPrice = calculateTotalPrice(cart.items);
    await cart.save();

    res.json(await populateCart(cart));
  } catch (error) {
    res.status(500).json({ message: "Server error adding to cart" });
  }
};

// Update cart item quantity
export const updateCartItem = async (req, res) => {
  try {
    const { bookId, quantity } = req.body;
    const requestedQuantity = Number(quantity);

    if (!bookId || !Number.isInteger(requestedQuantity) || requestedQuantity < 0) {
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

    if (requestedQuantity === 0) {
      cart.items = cart.items.filter((item) => !item.book.equals(bookId));
    } else {
      const book = await Book.findById(bookId);
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }
      if (book.stock < requestedQuantity) {
        return res.status(400).json({ message: "Insufficient stock" });
      }
      item.quantity = requestedQuantity;
      item.price = book.price;
    }

    cart.totalPrice = calculateTotalPrice(cart.items);
    await cart.save();

    res.json(await populateCart(cart));
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
    cart.totalPrice = calculateTotalPrice(cart.items);
    await cart.save();

    res.json(await populateCart(cart));
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

    res.json(await populateCart(cart));
  } catch (error) {
    res.status(500).json({ message: "Server error clearing cart" });
  }
};
