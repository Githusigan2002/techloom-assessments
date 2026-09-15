import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/common/LoadingSpinner";

export const AdminRoute = () => {
    const { isAuthenticated, isAdmin, loading } = useAuth();

    if (loading) {
        return <LoadingSpinner text="Verifying administrator access..." />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!isAdmin) {
        return <Navigate to="/products" replace />;
    }

    return <Outlet />;
};

export default AdminRoute;
