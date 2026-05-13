// src/routes/libraryRoutes.js
import express from "express";
import {
    addToLibrary,
    getReadingStats,
    getUserLibrary,
    removeFromLibrary,
    updateLibraryStatus,
    updateProgress,
} from "../controllers/libraryController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All library routes require authentication
router.use(protect);

router.post("/", addToLibrary);
router.get("/", getUserLibrary);
router.get("/stats", getReadingStats);
router.put("/:bookId/progress", updateProgress);
router.put("/:bookId/status", updateLibraryStatus);
router.delete("/:bookId", removeFromLibrary);

export default router;
