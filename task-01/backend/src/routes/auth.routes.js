import express from "express";
import {
    register,
    login,
    getCurrentUser,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// User Registration

router.post("/register", register);

// User Login

router.post("/login", login);

// Get Current User Profile

router.get("/me", protect, getCurrentUser);
router.get("/current-user", protect, getCurrentUser);

export default router;
