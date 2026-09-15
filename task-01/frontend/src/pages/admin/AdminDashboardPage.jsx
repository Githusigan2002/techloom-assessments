import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { productService } from "../../services/productService";
import { orderService } from "../../services/orderService";
import { formatCurrency } from "../../utils/formatters";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Alert from "../../components/common/Alert";

export const AdminDashboardPage = () => {
    const [stats, setStats] = useState({
        totalProducts: 0,
        lowStockCount: 0,
        pendingOrders: 0,
        paidOrders: 0,
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError("");

            // Fetch live products & orders from backend
            const [prodData, orderData] = await Promise.all([
                productService.getAllProducts(),
                orderService.getUserOrders(),
            ]);

            const products = prodData.products || [];
            const orders = orderData.orders || [];

            // Compute real statistics
            const lowStock = products.filter(
                (p) => (p.availableStock !== undefined ? p.availableStock : p.stock) <= 5
            ).length;

            const pending = orders.filter(
                (o) => o.status === "PENDING" || o.status === "RESERVED"
            ).length;

            const paid = orders.filter((o) => o.status === "PAID").length;

            setStats({
                totalProducts: products.length,
                lowStockCount: lowStock,
                pendingOrders: pending,
                paidOrders: paid,
            });

            setRecentOrders(orders.slice(0, 5));
        } catch (err) {
            console.error("Dashboard fetch error:", err);
            setError("Failed to load dashboard metrics from backend.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    if (loading) {
        return <LoadingSpinner text="Loading dashboard metrics..." />;
    }

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 border border-gray-200 rounded flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">System Overview</h1>
                    <p className="text-xs text-gray-500">Live operational metrics from POS database</p>
                </div>
                <button
                    onClick={fetchDashboardData}
                    className="text-xs border border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded font-medium text-gray-700"
                >
                    Refresh
                </button>
            </div>

            <Alert type="error" message={error} onClose={() => setError("")} />

            {/* Practical 4-stat grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded p-4">
                    <span className="text-xs text-gray-500 font-medium block">Total Products</span>
                    <span className="text-2xl font-bold text-gray-900 font-mono mt-1 block">
                        {stats.totalProducts}
                    </span>
                    <Link to="/admin/products" className="text-xs text-blue-600 hover:underline mt-2 inline-block font-medium">
                        View Products →
                    </Link>
                </div>

                <div className="bg-white border border-gray-200 rounded p-4">
                    <span className="text-xs text-gray-500 font-medium block">Low Stock Products</span>
                    <span className={`text-2xl font-bold font-mono mt-1 block ${stats.lowStockCount > 0 ? "text-amber-600" : "text-gray-900"}`}>
                        {stats.lowStockCount}
                    </span>
                    <Link to="/admin/inventory" className="text-xs text-blue-600 hover:underline mt-2 inline-block font-medium">
                        Check Inventory →
                    </Link>
                </div>

                <div className="bg-white border border-gray-200 rounded p-4">
                    <span className="text-xs text-gray-500 font-medium block">Pending / Reserved Orders</span>
                    <span className="text-2xl font-bold text-blue-600 font-mono mt-1 block">
                        {stats.pendingOrders}
                    </span>
                    <Link to="/admin/orders" className="text-xs text-blue-600 hover:underline mt-2 inline-block font-medium">
                        Manage Orders →
                    </Link>
                </div>

                <div className="bg-white border border-gray-200 rounded p-4">
                    <span className="text-xs text-gray-500 font-medium block">Completed / Paid Orders</span>
                    <span className="text-2xl font-bold text-emerald-600 font-mono mt-1 block">
                        {stats.paidOrders}
                    </span>
                    <span className="text-xs text-gray-400 mt-2 block font-mono">Confirmed Transactions</span>
                </div>
            </div>

            {/* Recent Orders Overview */}
            <div className="bg-white border border-gray-200 rounded overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-base font-bold text-gray-900">Recent Transactions</h2>
                    <Link to="/admin/orders" className="text-xs text-blue-600 hover:underline font-medium">
                        View All Orders →
                    </Link>
                </div>

                {recentOrders.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">No orders recorded yet.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                <tr>
                                    <th className="py-2.5 px-4">Order ID</th>
                                    <th className="py-2.5 px-4">Date</th>
                                    <th className="py-2.5 px-4 text-right">Amount</th>
                                    <th className="py-2.5 px-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-xs">
                                {recentOrders.map((ord) => (
                                    <tr key={ord._id} className="hover:bg-gray-50">
                                        <td className="py-2.5 px-4 font-mono font-medium text-gray-900">{ord.orderNumber}</td>
                                        <td className="py-2.5 px-4 text-gray-500">{new Date(ord.createdAt).toLocaleDateString()}</td>
                                        <td className="py-2.5 px-4 text-right font-mono font-bold text-gray-900">{formatCurrency(ord.totalAmount)}</td>
                                        <td className="py-2.5 px-4 text-center">
                                            <span className="inline-block px-2 py-0.5 rounded font-mono font-medium text-xs bg-gray-100 text-gray-800">
                                                {ord.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboardPage;
