import express from "express";
import {
    processPayment,
    getPaymentDetails,
} from "../controllers/payment.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Payments require authentication
router.use(protect);

router.post("/process", processPayment);
router.get("/:transactionId", getPaymentDetails);

export default router;
