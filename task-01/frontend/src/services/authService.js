import api from "./api";

export const authService = {
    // User login
    async login(email, password) {
        const response = await api.post("/auth/login", { email, password });
        return response.data;
    },

    // User registration
    async register(username, email, password, role = "user") {
        const response = await api.post("/auth/register", {
            username,
            email,
            password,
            role,
        });
        return response.data;
    },

    // Fetch current user details with active token
    async getCurrentUser() {
        const response = await api.get("/auth/me");
        return response.data;
    },
};
