// src/routes/cartRoutes.js
import express from "express";
import {
    addToCart,
    clearCart,
    getCart,
    removeFromCart,
    updateCartItem,
} from "../controllers/cartController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All cart routes require authentication
router.use(protect);

router.get("/", getCart);
router.post("/add", addToCart);
router.put("/update", updateCartItem);
router.post("/remove", removeFromCart);
router.post("/clear", clearCart);

export default router;
