import api from "./api";

export const productService = {
    // Get all products with optional query filters (search, category)
    async getAllProducts(params = {}) {
        const response = await api.get("/products", { params });
        return response.data;
    },

    // Get single product by ID
    async getProductById(id) {
        const response = await api.get(`/products/${id}`);
        return response.data;
    },

    // Create a new product (Admin)
    async createProduct(productData) {
        const response = await api.post("/products", productData);
        return response.data;
    },

    // Update product (Admin)
    async updateProduct(id, productData) {
        const response = await api.put(`/products/${id}`, productData);
        return response.data;
    },

    // Delete product (Admin)
    async deleteProduct(id) {
        const response = await api.delete(`/products/${id}`);
        return response.data;
    },

    // Get current stock information for product
    async getProductStock(id) {
        const response = await api.get(`/products/${id}/stock`);
        return response.data;
    },

    // Adjust product inventory stock (Admin)
    async updateProductStock(id, stockData) {
        const response = await api.patch(`/products/${id}/stock`, stockData);
        return response.data;
    },
};
