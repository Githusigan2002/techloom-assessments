import api from "./api";

export const cartService = {
    // Fetch current user's active cart
    async getCart() {
        const response = await api.get("/cart");
        return response.data;
    },

    // Add an item to the cart
    async addToCart(productId, quantity = 1) {
        const response = await api.post("/cart/items", { productId, quantity });
        return response.data;
    },

    // Update quantity of an item in cart
    async updateQuantity(productId, quantity) {
        const response = await api.put(`/cart/items/${productId}`, { quantity });
        return response.data;
    },

    // Remove an item from cart
    async removeItem(productId) {
        const response = await api.delete(`/cart/items/${productId}`);
        return response.data;
    },

    // Clear all items in cart
    async clearCart() {
        const response = await api.delete("/cart");
        return response.data;
    },
};
