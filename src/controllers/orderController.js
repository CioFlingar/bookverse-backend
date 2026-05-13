// src/controllers/orderController.js
import Cart from "../models/Cart.js";
import Book from "../models/Book.js";
import Order from "../models/Order.js";

// Create order from cart
export const createOrder = async (req, res) => {
  try {
    const { shippingAddress } = req.body;

    if (
      !shippingAddress ||
      !shippingAddress.street ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.zipCode
    ) {
      return res.status(400).json({ message: "Invalid shipping address" });
    }

    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.book",
    );
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const outOfStockItem = cart.items.find(
      (item) => !item.book || item.book.stock < item.quantity,
    );
    if (outOfStockItem) {
      return res.status(400).json({
        message: `${outOfStockItem.book?.title || "A book"} does not have enough stock`,
      });
    }

    const stockUpdate = await Book.bulkWrite(
      cart.items.map((item) => ({
        updateOne: {
          filter: { _id: item.book._id, stock: { $gte: item.quantity } },
          update: { $inc: { stock: -item.quantity } },
        },
      })),
    );

    if (stockUpdate.modifiedCount !== cart.items.length) {
      return res.status(400).json({ message: "Some cart items are no longer in stock" });
    }

    const order = await Order.create({
      user: req.user._id,
      items: cart.items.map((item) => ({
        book: item.book._id,
        quantity: item.quantity,
        price: item.price,
      })),
      totalPrice: cart.totalPrice,
      shippingAddress,
    });

    // Clear the cart after order creation
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: "Server error creating order" });
  }
};

// Get user's orders
export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate("items.book")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching orders" });
  }
};

// Get order by ID
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("items.book");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if user owns this order
    if (!order.user.equals(req.user._id)) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this order" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching order" });
  }
};

// Update order status (admin only)
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["Processing", "In Transit", "Delivered"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    ).populate("items.book");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Server error updating order" });
  }
};

// Get all orders (admin only)
export const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const pageNum = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 20;
    const skip = (pageNum - 1) * pageSize;

    const orders = await Order.find(filter)
      .populate("user")
      .populate("items.book")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    const total = await Order.countDocuments(filter);

    res.json({
      orders,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        pages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error fetching orders" });
  }
};

// Calculate revenue analytics
export const getRevenueAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    );
    const previousMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
    );

    const currentMonthRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: currentMonthStart, $lte: now },
          status: "Delivered",
        },
      },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);

    const previousMonthRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd },
          status: "Delivered",
        },
      },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);

    const mtdRevenue = currentMonthRevenue[0]?.total || 0;
    const previousMtdRevenue = previousMonthRevenue[0]?.total || 0;
    const growthPercentage =
      previousMtdRevenue > 0
        ? ((mtdRevenue - previousMtdRevenue) / previousMtdRevenue) * 100
        : 0;

    res.json({
      mtdRevenue,
      previousMtdRevenue,
      growthPercentage: growthPercentage.toFixed(2),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error calculating revenue" });
  }
};
