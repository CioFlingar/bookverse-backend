// src/routes/orderRoutes.js
import express from "express";
import {
    createOrder,
    getAllOrders,
    getOrderById,
    getRevenueAnalytics,
    getUserOrders,
    updateOrderStatus,
} from "../controllers/orderController.js";
import { admin } from "../middleware/adminMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// User routes
router.post("/", protect, createOrder);
router.get("/my-orders", protect, getUserOrders);
router.get("/:id", protect, getOrderById);

// Admin routes
router.put("/:id/status", protect, admin, updateOrderStatus);
router.get("/admin/all", protect, admin, getAllOrders);
router.get("/admin/analytics", protect, admin, getRevenueAnalytics);

export default router;
