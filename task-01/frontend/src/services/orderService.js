import api from "./api";

export const orderService = {
    // Convert cart into order and reserve stock for 5 minutes
    async checkout(idempotencyKey = null) {
        const response = await api.post("/orders/checkout", { idempotencyKey });
        return response.data;
    },

    // Get all orders for the current user (or admin list)
    async getUserOrders() {
        const response = await api.get("/orders");
        return response.data;
    },

    // Get single order details by ID
    async getOrderById(id) {
        const response = await api.get(`/orders/${id}`);
        return response.data;
    },

    // Cancel an order (releases or restores stock)
    async cancelOrder(id, reason = "Cancelled by user") {
        const response = await api.post(`/orders/${id}/cancel`, { reason });
        return response.data;
    },
};
