import mongoose from "mongoose";
import Order from "../models/order.model.js";
import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";
import { reservationService } from "./reservation.service.js";

// Defines what status transitions are allowed. An order cannot jump from CANCELLED back to PAID
const VALID_TRANSITIONS = {
    PENDING: ["RESERVED", "FAILED"],
    RESERVED: ["PAID", "FAILED", "EXPIRED", "CANCELLED"],
    PAID: ["CANCELLED"],
    CANCELLED: [],
    EXPIRED: [],
    FAILED: [],
};

export const orderService = {
    isValidTransition(currentStatus, newStatus) {
        const allowed = VALID_TRANSITIONS[currentStatus] || [];
        return allowed.includes(newStatus);
    },

    // Converts cart items into an order and locks inventory for 5 minutes
    async checkoutCart(userId, idempotencyKey = null) {
        // Return existing order if this checkout was already submitted
        if (idempotencyKey) {
            const existingOrder = await Order.findOne({ idempotencyKey });
            if (existingOrder) {
                return existingOrder;
            }
        }

        const cart = await Cart.findOne({ user: userId });
        if (!cart || !cart.items || cart.items.length === 0) {
            throw new Error("Cannot checkout: Your cart is empty");
        }

        const orderItems = cart.items.map((item) => ({
            product: item.product,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            itemTotal: Math.round(item.price * item.quantity * 100) / 100,
        }));

        const totalAmount = orderItems.reduce((acc, curr) => acc + curr.itemTotal, 0);

        let attempts = 0;
        const MAX_RETRIES = 12;

        // Use MongoDB transaction so stock hold, order creation, and cart reset all succeed together
        while (attempts < MAX_RETRIES) {
            attempts++;
            let session = null;
            try {
                session = await mongoose.startSession();
                session.startTransaction();
            } catch {
                session = null;
            }

            try {
                const currentCart = await Cart.findOne({ user: userId });
                if (!currentCart || !currentCart.items || currentCart.items.length === 0) {
                    throw new Error("Cannot checkout: Your cart is empty");
                }

                const orderId = new mongoose.Types.ObjectId();

                // Step 5: Atomically reserve stock for 5 minutes
                const reservation = await reservationService.reserveStockForOrder(
                    orderId,
                    userId,
                    orderItems,
                    session
                );

                // Step 6: Create and save order in RESERVED status with expiry timestamp
                const orderDoc = new Order({
                    _id: orderId,
                    orderNumber: `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
                    user: userId,
                    items: orderItems,
                    totalAmount: Math.round(totalAmount * 100) / 100,
                    status: "RESERVED",
                    reservation: reservation._id,
                    expiresAt: reservation.expiresAt,
                    idempotencyKey,
                });

                if (session) {
                    await orderDoc.save({ session });
                } else {
                    await orderDoc.save();
                }

                // Step 7: Clear user's cart after successful reservation
                currentCart.items = [];
                currentCart.totalAmount = 0;
                if (session) {
                    await currentCart.save({ session });
                    await session.commitTransaction();
                } else {
                    await currentCart.save();
                }

                return orderDoc;
            } catch (error) {
                if (session) {
                    try {
                        await session.abortTransaction();
                    } catch { }
                }

                // Check if this error is a transient write conflict under high concurrency
                const isWriteConflict =
                    error.message?.includes("Write conflict") ||
                    error.errorLabels?.includes("TransientTransactionError") ||
                    error.code === 112;

                // Retry on write conflict with progressive jittered backoff
                if (isWriteConflict && attempts < MAX_RETRIES) {
                    const delay = Math.min(600, 50 * attempts + Math.floor(Math.random() * 80));
                    await new Promise((resolve) => setTimeout(resolve, delay));
                    continue;
                }

                throw error;
            } finally {
                if (session) {
                    session.endSession();
                }
            }
        }
    },

    // Get order by ID
    async getOrderById(orderId) {
        const order = await Order.findById(orderId)
            .populate("user", "username email")
            .populate("reservation");

        if (!order) {
            throw new Error("Order not found");
        }

        return order;
    },

    // Get all orders for a specific user
    async getUserOrders(userId) {
        return Order.find({ user: userId })
            .populate("user", "username email")
            .sort({ createdAt: -1 });
    },

    // Get all orders (for admin / POS dashboard)
    async getAllOrders() {
        return Order.find()
            .populate("user", "username email")
            .sort({ createdAt: -1 });
    },

    // Cancel an order (Phase 10)
    // Safely restores stock based on order status (RESERVED or PAID)
    async cancelOrder(orderId, userId, reason = "Cancelled by user") {
        const order = await Order.findById(orderId);

        if (!order) {
            throw new Error("Order not found");
        }

        // Validate status transition
        if (!this.isValidTransition(order.status, "CANCELLED")) {
            throw new Error(
                `Cannot cancel order. Current status is '${order.status}'`
            );
        }

        // Case 1: Order is currently RESERVED (Waiting for payment)
        if (order.status === "RESERVED") {
            // Release the reservation and return held stock to availableStock
            if (order.reservation) {
                await reservationService.releaseReservationStock(order.reservation);
            }
            order.status = "CANCELLED";
            order.cancellationReason = reason;
            await order.save();
        }
        // Case 2: Order was already PAID (Refund / Cancellation after sale)
        else if (order.status === "PAID") {
            // Restore physical stock to inventory
            for (const item of order.items) {
                await Product.findByIdAndUpdate(item.product, {
                    $inc: {
                        stock: item.quantity,
                        availableStock: item.quantity,
                    },
                });
            }
            order.status = "CANCELLED";
            order.cancellationReason = reason;
            await order.save();
        }

        return order;
    },
};
