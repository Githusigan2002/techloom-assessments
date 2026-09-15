import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { orderService } from "../../services/orderService";
import { formatCurrency } from "../../utils/formatters";
import StatusBadge from "../../components/common/StatusBadge";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Alert from "../../components/common/Alert";

export const AdminOrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await orderService.getUserOrders();
            setOrders(data.orders || []);
        } catch (err) {
            console.error("Failed to fetch admin orders:", err);
            setError("Unable to load orders list");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const filteredOrders = statusFilter === "ALL"
        ? orders
        : orders.filter((o) => o.status === statusFilter);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 border border-gray-200 rounded gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">Order Management</h1>
                    <p className="text-xs text-gray-500">Monitor POS transactions, reservations, and payment settlements</p>
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-900"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="PAID">Paid</option>
                        <option value="RESERVED">Reserved</option>
                        <option value="PENDING">Pending</option>
                        <option value="CANCELLED">Cancelled</option>
                        <option value="EXPIRED">Expired</option>
                        <option value="FAILED">Failed</option>
                    </select>

                    <button
                        onClick={fetchOrders}
                        className="text-xs border border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded font-medium text-gray-700 whitespace-nowrap"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            <Alert type="error" message={error} onClose={() => setError("")} />

            {loading ? (
                <LoadingSpinner text="Loading orders..." />
            ) : filteredOrders.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded p-12 text-center text-gray-500 text-sm">
                    No orders found matching filter "{statusFilter}".
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                <tr>
                                    <th className="py-3 px-4">Order ID</th>
                                    <th className="py-3 px-4">Customer</th>
                                    <th className="py-3 px-4">Date & Time</th>
                                    <th className="py-3 px-4 text-center">Items</th>
                                    <th className="py-3 px-4 text-right">Amount</th>
                                    <th className="py-3 px-4 text-center">Status</th>
                                    <th className="py-3 px-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredOrders.map((ord) => (
                                    <tr key={ord._id} className="hover:bg-gray-50">
                                        <td className="py-3 px-4 font-mono font-medium text-gray-900">
                                            {ord.orderNumber}
                                        </td>
                                        <td className="py-3 px-4 text-gray-700 text-xs font-medium">
                                            {ord.user?.username || "POS User"}
                                        </td>
                                        <td className="py-3 px-4 text-xs text-gray-500">
                                            {new Date(ord.createdAt).toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4 text-center text-xs text-gray-600">
                                            {ord.items?.length || 0}
                                        </td>
                                        <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">
                                            {formatCurrency(ord.totalAmount)}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <StatusBadge status={ord.status} />
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <Link
                                                to={`/orders/${ord._id}`}
                                                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 px-2.5 py-1 rounded font-medium"
                                            >
                                                Details
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

export default AdminOrdersPage;
