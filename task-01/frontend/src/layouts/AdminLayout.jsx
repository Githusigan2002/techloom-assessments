import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const AdminLayout = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const navLinks = [
        { name: "Dashboard", path: "/admin", exact: true },
        { name: "Products", path: "/admin/products" },
        { name: "Inventory", path: "/admin/inventory" },
        { name: "Orders", path: "/admin/orders" },
    ];

    const isLinkActive = (item) => {
        if (item.exact) {
            return location.pathname === item.path;
        }
        return location.pathname.startsWith(item.path);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Top Admin Header */}
            <header className="bg-gray-900 text-white sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-14 items-center">
                        <div className="flex items-center space-x-6">
                            <Link to="/admin" className="font-bold text-base tracking-tight flex items-center">
                                <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded font-mono mr-2">
                                    ADMIN
                                </span>
                                POS Management
                            </Link>

                            {/* Desktop Admin Tabs */}
                            <nav className="hidden md:flex space-x-4 h-14 items-center text-sm">
                                {navLinks.map((item) => {
                                    const active = isLinkActive(item);
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            className={`px-3 py-1.5 rounded text-sm transition-colors ${
                                                active
                                                    ? "bg-gray-800 text-white font-medium"
                                                    : "text-gray-300 hover:text-white hover:bg-gray-800"
                                            }`}
                                        >
                                            {item.name}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Right side controls */}
                        <div className="hidden md:flex items-center space-x-4 text-xs">
                            <Link
                                to="/products"
                                className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-3 py-1.5 rounded border border-gray-700"
                            >
                                ← Open POS Terminal
                            </Link>
                            <span className="text-gray-400">Admin: {user?.username}</span>
                            <button
                                onClick={handleLogout}
                                className="text-gray-400 hover:text-red-400 px-2 py-1 rounded"
                            >
                                Logout
                            </button>
                        </div>

                        {/* Mobile menu button */}
                        <div className="flex md:hidden">
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="p-2 text-gray-300 hover:text-white"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    {mobileMenuOpen ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                    )}
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Admin dropdown */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-gray-800 px-4 pt-2 pb-3 space-y-1 text-sm border-t border-gray-700">
                        {navLinks.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setMobileMenuOpen(false)}
                                className="block py-2 text-gray-200 hover:text-white"
                            >
                                {item.name}
                            </Link>
                        ))}
                        <Link
                            to="/products"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block py-2 text-blue-400 font-semibold"
                        >
                            ← Switch to POS Terminal
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="block w-full text-left py-2 text-red-400"
                        >
                            Logout
                        </button>
                    </div>
                )}
            </header>

            {/* Main Admin Content Container */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <Outlet />
            </main>

            <footer className="bg-white border-t border-gray-200 py-3 text-center text-xs text-gray-500">
                POS Administration Console &copy; {new Date().getFullYear()}
            </footer>
        </div>
    );
};

export default AdminLayout;
