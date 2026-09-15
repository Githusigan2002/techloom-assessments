import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { orderService } from "../../services/orderService";
import { formatCurrency } from "../../utils/formatters";
import StatusBadge from "../../components/common/StatusBadge";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Alert from "../../components/common/Alert";

export const OrderDetailPage = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const fetchOrder = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await orderService.getOrderById(id);
            setOrder(data.order);
        } catch (err) {
            console.error("Failed to load order:", err);
            setError("Unable to load order details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrder();
    }, [id]);

    const handleCancelOrder = async () => {
        const reason = window.prompt("Please provide a reason for cancelling this order:", "Customer requested cancellation");
        if (reason === null) return; // User cancelled prompt

        try {
            setCancelling(true);
            setError("");
            setSuccessMessage("");
            const data = await orderService.cancelOrder(id, reason);
            setOrder(data.order);
            setSuccessMessage("Order was successfully cancelled and stock restored to inventory.");
        } catch (err) {
            console.error("Cancel failed:", err);
            setError(err.response?.data?.message || "Failed to cancel order");
        } finally {
            setCancelling(false);
        }
    };

    if (loading) {
        return <LoadingSpinner text="Loading order receipt..." />;
    }

    if (!order) {
        return (
            <div className="bg-white border border-gray-200 rounded p-8 text-center text-gray-500">
                <p className="mb-4">Order not found.</p>
                <Link to="/orders" className="text-blue-600 hover:underline text-sm font-medium">
                    ← Back to My Orders
                </Link>
            </div>
        );
    }

    const canCancel = order.status === "RESERVED" || order.status === "PAID";

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white p-4 border border-gray-200 rounded">
                <div>
                    <div className="flex items-center space-x-3">
                        <h1 className="text-xl font-bold font-mono text-gray-900">{order.orderNumber}</h1>
                        <StatusBadge status={order.status} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Placed on {new Date(order.createdAt).toLocaleString()}
                    </p>
                </div>

                <div className="flex items-center space-x-3">
                    {canCancel && (
                        <button
                            type="button"
                            onClick={handleCancelOrder}
                            disabled={cancelling}
                            className="bg-white border border-red-300 text-red-700 hover:bg-red-50 text-xs font-semibold px-3 py-1.5 rounded transition-colors"
                        >
                            {cancelling ? "Cancelling..." : "Cancel Order"}
                        </button>
                    )}
                    <Link
                        to="/orders"
                        className="text-xs text-gray-600 border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded font-medium"
                    >
                        ← Back
                    </Link>
                </div>
            </div>

            <Alert type="error" message={error} onClose={() => setError("")} />
            {successMessage && <Alert type="success" message={successMessage} onClose={() => setSuccessMessage("")} />}

            {/* Receipt Summary Card */}
            <div className="bg-white border border-gray-200 rounded p-6 space-y-6">
                {/* Meta details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pb-4 border-b border-gray-200">
                    <div>
                        <span className="text-gray-400 block mb-0.5">Order Status</span>
                        <StatusBadge status={order.status} />
                    </div>
                    <div>
                        <span className="text-gray-400 block mb-0.5">Payment Status</span>
                        <span className="font-semibold text-gray-800">{order.paymentStatus || "PENDING"}</span>
                    </div>
                    <div>
                        <span className="text-gray-400 block mb-0.5">Customer</span>
                        <span className="font-medium text-gray-800">{order.user?.username || "Guest"}</span>
                    </div>
                    <div>
                        <span className="text-gray-400 block mb-0.5">Reservation</span>
                        <span className="font-mono text-gray-800 text-xs">
                            {order.reservation?.status || (order.expiresAt ? "5-min lock" : "N/A")}
                        </span>
                    </div>
                </div>

                {/* Items Table */}
                <div>
                    <h2 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider text-xs">Purchased Items</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-gray-200 text-xs text-gray-500 uppercase">
                                <tr>
                                    <th className="py-2">Item</th>
                                    <th className="py-2 text-right">Price</th>
                                    <th className="py-2 text-center">Qty</th>
                                    <th className="py-2 text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {order.items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="py-2.5 font-medium text-gray-800">{item.name}</td>
                                        <td className="py-2.5 text-right font-mono text-gray-600">{formatCurrency(item.price)}</td>
                                        <td className="py-2.5 text-center font-mono text-gray-700">{item.quantity}</td>
                                        <td className="py-2.5 text-right font-mono font-semibold text-gray-900">
                                            {formatCurrency(item.itemTotal)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="border-t border-gray-200">
                                <tr>
                                    <td colSpan="3" className="pt-4 text-right font-bold text-base text-gray-900">
                                        Total Paid:
                                    </td>
                                    <td className="pt-4 text-right font-bold text-base font-mono text-gray-900">
                                        {formatCurrency(order.totalAmount)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {order.cancellationReason && (
                    <div className="bg-red-50 border border-red-200 rounded p-3 text-xs text-red-800">
                        <strong>Cancellation Note:</strong> {order.cancellationReason}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderDetailPage;
