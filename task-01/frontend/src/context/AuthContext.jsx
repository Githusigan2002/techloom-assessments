import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("token") || null);
    const [loading, setLoading] = useState(true);

    // Fetch current user on initial load if token exists
    useEffect(() => {
        const loadUser = async () => {
            if (token) {
                try {
                    const data = await authService.getCurrentUser();
                    setUser(data.user);
                } catch (error) {
                    console.error("Session verification failed:", error);
                    logout();
                }
            }
            setLoading(false);
        };

        loadUser();
    }, [token]);

    // Handle user login
    const login = async (email, password) => {
        const data = await authService.login(email, password);
        localStorage.setItem("token", data.token);
        setToken(data.token);
        setUser(data.user);
        return data;
    };

    // Handle user registration
    const register = async (username, email, password, role) => {
        const data = await authService.register(username, email, password, role);
        localStorage.setItem("token", data.token);
        setToken(data.token);
        setUser(data.user);
        return data;
    };

    // Handle user logout
    const logout = () => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
    };

    const value = {
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!token,
        isAdmin: user?.role === "admin",
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook for accessing auth state
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
