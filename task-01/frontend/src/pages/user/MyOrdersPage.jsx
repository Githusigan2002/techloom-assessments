import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { orderService } from "../../services/orderService";
import { formatCurrency } from "../../utils/formatters";
import StatusBadge from "../../components/common/StatusBadge";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Alert from "../../components/common/Alert";

export const MyOrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await orderService.getUserOrders();
            setOrders(data.orders || []);
        } catch (err) {
            console.error("Failed to load orders:", err);
            setError("Unable to load orders. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 border border-gray-200 rounded">
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">My Orders</h1>
                <p className="text-xs text-gray-500">View and track your previous POS transactions and receipts</p>
            </div>

            <Alert type="error" message={error} onClose={() => setError("")} />

            {loading ? (
                <LoadingSpinner text="Loading your orders..." />
            ) : orders.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded p-12 text-center text-gray-500 text-sm">
                    <p className="mb-4">No orders found.</p>
                    <Link
                        to="/products"
                        className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded text-sm font-medium"
                    >
                        Start Shopping
                    </Link>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                <tr>
                                    <th className="py-3 px-4">Order ID</th>
                                    <th className="py-3 px-4">Date</th>
                                    <th className="py-3 px-4 text-center">Items</th>
                                    <th className="py-3 px-4 text-right">Total</th>
                                    <th className="py-3 px-4 text-center">Status</th>
                                    <th className="py-3 px-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {orders.map((order) => (
                                    <tr key={order._id} className="hover:bg-gray-50">
                                        <td className="py-3 px-4 font-mono font-medium text-gray-900">
                                            {order.orderNumber}
                                        </td>
                                        <td className="py-3 px-4 text-xs text-gray-600">
                                            {new Date(order.createdAt).toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4 text-center text-xs text-gray-700">
                                            {order.items?.length || 0} item(s)
                                        </td>
                                        <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">
                                            {formatCurrency(order.totalAmount)}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <StatusBadge status={order.status} />
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <Link
                                                to={`/orders/${order._id}`}
                                                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 px-2.5 py-1 rounded font-medium"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyOrdersPage;
