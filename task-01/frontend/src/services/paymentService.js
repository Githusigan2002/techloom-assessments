import api from "./api";

export const paymentService = {
    // Process mock payment with specified outcome (SUCCESS, FAILED, TIMEOUT)
    async processPayment(orderId, outcome = "SUCCESS", idempotencyKey = null, paymentMethod = "CARD") {
        const response = await api.post("/payments/process", {
            orderId,
            outcome,
            idempotencyKey,
            paymentMethod,
        });
        return response.data;
    },

    // Get payment details by transaction ID
    async getPaymentByTransactionId(transactionId) {
        const response = await api.get(`/payments/${transactionId}`);
        return response.data;
    },
};
