import Order from "../models/order.model.js";
import Payment from "../models/payment.model.js";
import { reservationService } from "./reservation.service.js";

export const paymentService = {
    // Process mock payment with idempotency and simulated outcomes
    async processPayment(orderId, userId, paymentData = {}) {
        const {
            paymentMethod = "CARD",
            outcome = "SUCCESS",
            idempotencyKey,
        } = paymentData;

        // If the user double-clicks or retries, return the original payment instead of charging again
        if (idempotencyKey) {
            const existingPayment = await Payment.findOne({ idempotencyKey });
            if (existingPayment) {
                const existingOrder = await Order.findById(existingPayment.order);
                return {
                    payment: existingPayment,
                    order: existingOrder,
                    isIdempotentReplay: true,
                };
            }
        }

        const order = await Order.findById(orderId);
        if (!order) {
            throw new Error("Order not found");
        }

        if (order.status !== "RESERVED") {
            throw new Error(
                `Payment cannot be processed. Order status is '${order.status}' (expected 'RESERVED')`
            );
        }

        // If user took more than 5 minutes to submit payment, cancel hold and return stock
        if (order.expiresAt && new Date(order.expiresAt) <= new Date()) {
            if (order.reservation) {
                await reservationService.expireReservationStock(order.reservation);
            }
            order.status = "EXPIRED";
            order.paymentStatus = "FAILED";
            await order.save();

            throw new Error(
                "Payment failed: Stock reservation has expired (5-minute limit elapsed). Stock has been returned to inventory."
            );
        }

        const transactionId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const validKey = idempotencyKey || `IDEM-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        let paymentStatus;

        if (outcome === "SUCCESS") {
            paymentStatus = "SUCCESS";

            // Payment succeeded: confirm stock deduction and mark order paid
            if (order.reservation) {
                await reservationService.confirmReservationStock(order.reservation);
            }

            order.status = "PAID";
            order.paymentStatus = "COMPLETED";
            await order.save();
        } else if (outcome === "FAILED") {
            paymentStatus = "FAILED";

            // Payment declined: release the reserved items immediately
            if (order.reservation) {
                await reservationService.releaseReservationStock(order.reservation);
            }

            order.status = "FAILED";
            order.paymentStatus = "FAILED";
            await order.save();
        } else if (outcome === "TIMEOUT") {
            paymentStatus = "TIMEOUT";

            // Gateway stalled: expire the reservation and return stock
            if (order.reservation) {
                await reservationService.expireReservationStock(order.reservation);
            }

            order.status = "EXPIRED";
            order.paymentStatus = "FAILED";
            await order.save();
        } else {
            throw new Error(
                `Invalid outcome '${outcome}'. Allowed: SUCCESS, FAILED, TIMEOUT`
            );
        }

        // Save transaction receipt in database
        const payment = await Payment.create({
            order: order._id,
            user: userId,
            amount: order.totalAmount,
            paymentMethod,
            status: paymentStatus,
            idempotencyKey: validKey,
            transactionId,
        });

        return {
            payment,
            order,
            isIdempotentReplay: false,
        };
    },

    // Get payment details by ID or transactionId
    async getPaymentByTransactionId(transactionId) {
        return Payment.findOne({ transactionId }).populate("order");
    },
};
