import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

export const Navbar = () => {
    const { user, logout, isAdmin } = useAuth();
    const { itemCount } = useCart();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const isActive = (path) => {
        return location.pathname === path
            ? "text-blue-600 font-semibold border-b-2 border-blue-600"
            : "text-gray-600 hover:text-gray-900";
    };

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-14 items-center">
                    {/* Brand */}
                    <div className="flex items-center space-x-6">
                        <Link
                            to="/products"
                            className="text-lg font-bold text-gray-900 tracking-tight flex items-center"
                        >
                            <span className="bg-gray-900 text-white px-2 py-0.5 rounded text-sm mr-2 font-mono">
                                POS
                            </span>
                            Store & Inventory
                        </Link>

                        {/* Desktop Navigation Links */}
                        <nav className="hidden md:flex space-x-6 h-14 items-center text-sm">
                            <Link to="/products" className={`py-4 ${isActive("/products")}`}>
                                Products
                            </Link>
                            <Link to="/cart" className={`py-4 flex items-center ${isActive("/cart")}`}>
                                Cart
                                {itemCount > 0 && (
                                    <span className="ml-1.5 bg-blue-600 text-white rounded-full text-xs px-1.5 py-0.2 font-semibold">
                                        {itemCount}
                                    </span>
                                )}
                            </Link>
                            <Link to="/orders" className={`py-4 ${isActive("/orders")}`}>
                                My Orders
                            </Link>
                        </nav>
                    </div>

                    {/* Right side user info & action */}
                    <div className="hidden md:flex items-center space-x-4 text-sm">
                        {isAdmin && (
                            <Link
                                to="/admin"
                                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded border border-gray-300 text-xs font-medium"
                            >
                                Switch to Admin
                            </Link>
                        )}

                        <div className="text-gray-600">
                            <span className="text-xs text-gray-400 block leading-tight">Logged in as</span>
                            <span className="font-medium text-gray-800">{user?.username}</span>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="text-gray-600 hover:text-red-600 text-sm font-medium border border-gray-200 px-3 py-1.5 rounded hover:bg-gray-50"
                        >
                            Logout
                        </button>
                    </div>

                    {/* Mobile menu button */}
                    <div className="flex md:hidden items-center space-x-2">
                        <Link to="/cart" className="relative p-2 text-gray-600">
                            🛒
                            {itemCount > 0 && (
                                <span className="absolute top-0 right-0 bg-blue-600 text-white rounded-full text-xs px-1 font-semibold">
                                    {itemCount}
                                </span>
                            )}
                        </Link>
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            type="button"
                            className="p-2 rounded text-gray-600 hover:text-gray-900 border border-gray-200"
                        >
                            <span className="sr-only">Toggle menu</span>
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

            {/* Mobile menu dropdown */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-gray-200 bg-gray-50 px-4 pt-2 pb-4 space-y-2 text-sm">
                    <Link
                        to="/products"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block py-2 text-gray-700 font-medium"
                    >
                        Products
                    </Link>
                    <Link
                        to="/cart"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block py-2 text-gray-700 font-medium"
                    >
                        Cart ({itemCount} items)
                    </Link>
                    <Link
                        to="/orders"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block py-2 text-gray-700 font-medium"
                    >
                        My Orders
                    </Link>

                    {isAdmin && (
                        <Link
                            to="/admin"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block py-2 text-blue-700 font-semibold"
                        >
                            Switch to Admin Portal →
                        </Link>
                    )}

                    <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                        <span className="text-xs text-gray-500">User: {user?.username}</span>
                        <button
                            onClick={handleLogout}
                            className="text-xs text-red-600 font-semibold uppercase"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Navbar;
