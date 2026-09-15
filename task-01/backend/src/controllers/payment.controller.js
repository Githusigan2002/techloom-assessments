import { paymentService } from "../services/payment.service.js";

// Mock payment for a reserved order

export const processPayment = async (req, res) => {
    try {
        const { orderId, paymentMethod, outcome, idempotencyKey } = req.body;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: "Order ID is required to process payment",
            });
        }

        const result = await paymentService.processPayment(orderId, req.user._id, {
            paymentMethod,
            outcome: outcome || "SUCCESS",
            idempotencyKey,
        });

        res.status(200).json({
            success: result.payment.status === "SUCCESS",
            message:
                result.payment.status === "SUCCESS"
                    ? "Payment successful! Order confirmed."
                    : `Payment ended with status: ${result.payment.status}`,
            payment: result.payment,
            order: result.order,
            isIdempotentReplay: result.isIdempotentReplay,
        });
    } catch (error) {
        console.error("Payment error:", error);
        res.status(400).json({
            success: false,
            message: error.message || "Payment processing failed",
        });
    }
};

// Get payment by transaction ID
export const getPaymentDetails = async (req, res) => {
    try {
        const payment = await paymentService.getPaymentByTransactionId(
            req.params.transactionId
        );

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment transaction not found",
            });
        }

        res.status(200).json({
            success: true,
            payment,
        });
    } catch (error) {
        console.error("Error fetching payment:", error);
        res.status(500).json({
            success: false,
            message: "Server error fetching payment",
        });
    }
};
