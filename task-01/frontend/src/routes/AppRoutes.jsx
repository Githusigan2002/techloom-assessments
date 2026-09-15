import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Layouts
import MainLayout from "../layouts/MainLayout";
import AdminLayout from "../layouts/AdminLayout";

// Route Guards
import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";

// Auth Pages
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";

// User POS Pages
import ProductsPage from "../pages/user/ProductsPage";
import ProductDetailPage from "../pages/user/ProductDetailPage";
import CartPage from "../pages/user/CartPage";
import CheckoutPage from "../pages/user/CheckoutPage";
import MyOrdersPage from "../pages/user/MyOrdersPage";
import OrderDetailPage from "../pages/user/OrderDetailPage";

// Admin Pages
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminProductsPage from "../pages/admin/AdminProductsPage";
import ProductFormPage from "../pages/admin/ProductFormPage";
import AdminInventoryPage from "../pages/admin/AdminInventoryPage";
import AdminOrdersPage from "../pages/admin/AdminOrdersPage";

export const AppRoutes = () => {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected User POS Routes */}
            <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                    <Route path="/" element={<Navigate to="/products" replace />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/products/:id" element={<ProductDetailPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/orders" element={<MyOrdersPage />} />
                    <Route path="/orders/:id" element={<OrderDetailPage />} />
                </Route>
            </Route>

            {/* Protected Admin Routes */}
            <Route element={<AdminRoute />}>
                <Route element={<AdminLayout />}>
                    <Route path="/admin" element={<AdminDashboardPage />} />
                    <Route path="/admin/products" element={<AdminProductsPage />} />
                    <Route path="/admin/products/new" element={<ProductFormPage />} />
                    <Route path="/admin/products/:id/edit" element={<ProductFormPage />} />
                    <Route path="/admin/inventory" element={<AdminInventoryPage />} />
                    <Route path="/admin/orders" element={<AdminOrdersPage />} />
                </Route>
            </Route>

            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/products" replace />} />
        </Routes>
    );
};

export default AppRoutes;
