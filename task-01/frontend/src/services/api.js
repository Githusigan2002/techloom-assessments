import axios from "axios";

// Central Axios instance pointing to backend API URL
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
    headers: {
        "Content-Type": "application/json",
    },
});

// Request Interceptor: Automatically attach JWT token from localStorage if available
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Format error messages cleanly
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // If token expired or unauthorized, optional logout hook can trigger
        if (error.response && error.response.status === 401) {
            // Can handle session expiration here if needed
        }
        return Promise.reject(error);
    }
);

export default api;
