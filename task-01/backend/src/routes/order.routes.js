import express from "express";
import {
    checkout,
    getOrderById,
    getUserOrders,
    cancelOrder,
} from "../controllers/order.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// All order endpoints require authentication
router.use(protect);

router.post("/checkout", checkout);
router.get("/", getUserOrders);
router.get("/:id", getOrderById);
router.post("/:id/cancel", cancelOrder);

export default router;
