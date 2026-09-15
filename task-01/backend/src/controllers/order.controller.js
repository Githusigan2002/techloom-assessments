import { orderService } from "../services/order.service.js";

// Converts active cart items into an order and locks inventory for 5 minutes
export const checkout = async (req, res) => {
    try {
        const { idempotencyKey } = req.body;
        const order = await orderService.checkoutCart(req.user._id, idempotencyKey);

        res.status(201).json({
            success: true,
            message: "Order created successfully! Stock is reserved for 5 minutes.",
            order,
            reservationExpiresAt: order.expiresAt,
        });
    } catch (error) {
        console.error("Checkout failed:", error);
        res.status(400).json({
            success: false,
            message: error.message || "Checkout failed",
        });
    }
};

export const getOrderById = async (req, res) => {
    try {
        const order = await orderService.getOrderById(req.params.id);

        // Staff can inspect any order; customers can only view their own
        const isStaff = req.user.role === "admin" || req.user.role === "cashier";
        const orderUserId = order.user?._id ? order.user._id.toString() : order.user?.toString();
        const isOwner = orderUserId === req.user._id.toString();

        if (!isStaff && !isOwner) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to view this order",
            });
        }

        res.status(200).json({
            success: true,
            order,
        });
    } catch (error) {
        console.error("Error fetching order:", error);
        res.status(404).json({
            success: false,
            message: error.message || "Order not found",
        });
    }
};

export const getUserOrders = async (req, res) => {
    try {
        let orders;

        // Admins see all store transactions, while regular buyers see only their history
        if (req.user.role === "admin" || req.user.role === "cashier") {
            orders = await orderService.getAllOrders();
        } else {
            orders = await orderService.getUserOrders(req.user._id);
        }

        res.status(200).json({
            success: true,
            count: orders.length,
            orders,
        });
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({
            success: false,
            message: "Server error fetching orders",
        });
    }
};

export const cancelOrder = async (req, res) => {
    try {
        const { reason } = req.body;

        const order = await orderService.getOrderById(req.params.id);
        const isStaff = req.user.role === "admin" || req.user.role === "cashier";
        const orderUserId = order.user?._id ? order.user._id.toString() : order.user?.toString();
        const isOwner = orderUserId === req.user._id.toString();

        if (!isStaff && !isOwner) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to cancel this order",
            });
        }

        // Cancel order and put reserved or paid stock back into available inventory
        const cancelledOrder = await orderService.cancelOrder(req.params.id, req.user._id, reason);

        res.status(200).json({
            success: true,
            message: "Order cancelled successfully and stock restored.",
            order: cancelledOrder,
        });
    } catch (error) {
        console.error("Error cancelling order:", error);
        res.status(400).json({
            success: false,
            message: error.message || "Failed to cancel order",
        });
    }
};
