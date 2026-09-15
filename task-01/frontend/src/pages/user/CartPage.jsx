import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { orderService } from "../../services/orderService";
import { formatCurrency } from "../../utils/formatters";
import Alert from "../../components/common/Alert";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export const CartPage = () => {
    const { cart, loading, updateQuantity, removeItem, clearCart, fetchCart } = useCart();
    const [actionLoading, setActionLoading] = useState(false);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleQuantityChange = async (productId, newQuantity) => {
        try {
            setActionLoading(true);
            setError("");
            await updateQuantity(productId, newQuantity);
        } catch (err) {
            console.error("Failed to update cart quantity:", err);
            setError(err.response?.data?.message || err.message || "Failed to update item quantity");
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemove = async (productId) => {
        try {
            setActionLoading(true);
            setError("");
            await removeItem(productId);
        } catch (err) {
            console.error("Failed to remove item:", err);
            setError(err.response?.data?.message || "Failed to remove item");
        } finally {
            setActionLoading(false);
        }
    };

    const handleClearCart = async () => {
        if (window.confirm("Are you sure you want to clear your cart?")) {
            try {
                setActionLoading(true);
                setError("");
                await clearCart();
            } catch (err) {
                console.error("Failed to clear cart:", err);
                setError(err.response?.data?.message || "Failed to clear cart");
            } finally {
                setActionLoading(false);
            }
        }
    };

    // Direct Checkout: Atomically reserves stock and starts 5-minute timer immediately
    const handleProceedToCheckout = async () => {
        try {
            setCheckoutLoading(true);
            setError("");
            const idempotencyKey = `CHK-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
            const data = await orderService.checkout(idempotencyKey);

            // Refresh cart state (backend empties cart on successful order creation)
            await fetchCart();

            // Navigate directly to Checkout page with reserved order and live timer
            navigate("/checkout", { state: { order: data.order } });
        } catch (err) {
            console.error("Direct checkout failed:", err);
            setError(
                err.response?.data?.message ||
                err.message ||
                "Failed to reserve stock. Please check product availability."
            );
        } finally {
            setCheckoutLoading(false);
        }
    };

    const items = cart?.items || [];
    const isCartEmpty = items.length === 0;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 border border-gray-200 rounded">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">Active Shopping Cart</h1>
                    <p className="text-xs text-gray-500">Review items before proceeding to checkout and stock reservation</p>
                </div>
                {!isCartEmpty && (
                    <button
                        onClick={handleClearCart}
                        disabled={actionLoading || checkoutLoading}
                        className="text-xs text-red-600 hover:text-red-800 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded transition-colors font-medium"
                    >
                        Clear Cart
                    </button>
                )}
            </div>

            <Alert type="error" message={error} onClose={() => setError("")} />

            {loading ? (
                <LoadingSpinner text="Loading cart..." />
            ) : isCartEmpty ? (
                <div className="bg-white border border-gray-200 rounded p-12 text-center">
                    <p className="text-gray-500 text-sm mb-4">Your shopping cart is currently empty.</p>
                    <Link
                        to="/products"
                        className="inline-block bg-gray-900 hover:bg-black text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                    >
                        Browse Products
                    </Link>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded overflow-hidden">
                    {/* Cart Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                <tr>
                                    <th className="py-3 px-4">Product</th>
                                    <th className="py-3 px-4 text-right">Unit Price</th>
                                    <th className="py-3 px-4 text-center">Quantity</th>
                                    <th className="py-3 px-4 text-right">Subtotal</th>
                                    <th className="py-3 px-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {items.map((item) => {
                                    const subtotal = item.price * item.quantity;
                                    const productId = item.product?._id || item.product;

                                    return (
                                        <tr key={productId} className="hover:bg-gray-50">
                                            <td className="py-3 px-4">
                                                <div className="font-medium text-gray-900">{item.name}</div>
                                                {item.product?.sku && (
                                                    <div className="text-xs text-gray-400 font-mono">
                                                        SKU: {item.product.sku}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-right font-mono text-gray-700">
                                                {formatCurrency(item.price)}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center justify-center space-x-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleQuantityChange(productId, item.quantity - 1)}
                                                        disabled={actionLoading || checkoutLoading || item.quantity <= 1}
                                                        className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded text-gray-700 hover:bg-gray-100 disabled:opacity-40"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="w-8 text-center font-mono font-medium">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleQuantityChange(productId, item.quantity + 1)}
                                                        disabled={actionLoading || checkoutLoading}
                                                        className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded text-gray-700 hover:bg-gray-100 disabled:opacity-40"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">
                                                {formatCurrency(subtotal)}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemove(productId)}
                                                    disabled={actionLoading || checkoutLoading}
                                                    className="text-xs text-red-600 hover:text-red-800 font-medium"
                                                >
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary & Checkout Footer */}
                    <div className="bg-gray-50 border-t border-gray-200 p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <Link
                            to="/products"
                            className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center"
                        >
                            ← Continue Shopping
                        </Link>

                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                            <div className="text-center sm:text-right">
                                <span className="text-xs text-gray-500 block">Total Amount</span>
                                <span className="text-2xl font-bold font-mono text-gray-900">
                                    {formatCurrency(cart?.totalAmount)}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={handleProceedToCheckout}
                                disabled={checkoutLoading || actionLoading}
                                className="w-full sm:w-auto bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded text-sm font-semibold transition-colors disabled:opacity-50"
                            >
                                {checkoutLoading ? "Reserving Stock & Starting..." : "Proceed to Checkout →"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CartPage;
