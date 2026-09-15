import React, { useState, useEffect } from "react";
import { productService } from "../../services/productService";
import StatusBadge from "../../components/common/StatusBadge";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Alert from "../../components/common/Alert";

export const AdminInventoryPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // Modal state for stock adjustment
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [adjustAction, setAdjustAction] = useState("add"); // "add", "reduce", "set"
    const [adjustQuantity, setAdjustQuantity] = useState("");
    const [adjusting, setAdjusting] = useState(false);

    const fetchInventory = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await productService.getAllProducts();
            setProducts(data.products || []);
        } catch (err) {
            console.error("Failed to load inventory:", err);
            setError("Unable to load inventory data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    const openAdjustModal = (product) => {
        setSelectedProduct(product);
        setAdjustAction("add");
        setAdjustQuantity("");
        setError("");
        setSuccessMessage("");
    };

    const handleAdjustSubmit = async (e) => {
        e.preventDefault();
        const qty = Number(adjustQuantity);

        if (isNaN(qty) || qty <= 0) {
            setError("Quantity must be a positive number");
            return;
        }

        try {
            setAdjusting(true);
            setError("");

            const payload =
                adjustAction === "set"
                    ? { stock: qty }
                    : { quantity: qty, action: adjustAction };

            await productService.updateProductStock(selectedProduct._id, payload);

            setSuccessMessage(`Inventory updated for "${selectedProduct.name}".`);
            setSelectedProduct(null);
            await fetchInventory();
        } catch (err) {
            console.error("Adjustment failed:", err);
            setError(err.response?.data?.message || "Failed to update inventory.");
        } finally {
            setAdjusting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 border border-gray-200 rounded flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">Inventory Tracking</h1>
                    <p className="text-xs text-gray-500">Live physical, reserved, and available stock levels</p>
                </div>
                <button
                    onClick={fetchInventory}
                    className="text-xs border border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded font-medium text-gray-700"
                >
                    Refresh Data
                </button>
            </div>

            {successMessage && <Alert type="success" message={successMessage} onClose={() => setSuccessMessage("")} />}
            {error && <Alert type="error" message={error} onClose={() => setError("")} />}

            {loading ? (
                <LoadingSpinner text="Fetching inventory counts..." />
            ) : products.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded p-12 text-center text-gray-500 text-sm">
                    No inventory records found.
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                <tr>
                                    <th className="py-3 px-4">Product Name</th>
                                    <th className="py-3 px-4 font-mono">SKU</th>
                                    <th className="py-3 px-4 text-center">Total Stock</th>
                                    <th className="py-3 px-4 text-center">Reserved (Checkout Lock)</th>
                                    <th className="py-3 px-4 text-center">Available Stock</th>
                                    <th className="py-3 px-4 text-center">Status</th>
                                    <th className="py-3 px-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {products.map((p) => {
                                    const available = p.availableStock !== undefined
                                        ? p.availableStock
                                        : Math.max(0, p.stock - (p.reservedStock || 0));

                                    const stockStatus =
                                        available <= 0
                                            ? "OUT OF STOCK"
                                            : available <= 5
                                            ? "LOW STOCK"
                                            : "IN STOCK";

                                    return (
                                        <tr key={p._id} className="hover:bg-gray-50">
                                            <td className="py-3 px-4 font-medium text-gray-900">{p.name}</td>
                                            <td className="py-3 px-4 font-mono text-xs text-gray-500">{p.sku}</td>
                                            <td className="py-3 px-4 text-center font-mono font-medium text-gray-800">
                                                {p.stock}
                                            </td>
                                            <td className="py-3 px-4 text-center font-mono font-medium text-amber-600">
                                                {p.reservedStock || 0}
                                            </td>
                                            <td className="py-3 px-4 text-center font-mono font-bold text-gray-900">
                                                {available}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <StatusBadge status={stockStatus} />
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => openAdjustModal(p)}
                                                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 px-2.5 py-1 rounded font-medium"
                                                >
                                                    Adjust Stock
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Quick Stock Adjustment Modal */}
            {selectedProduct && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded border border-gray-300 max-w-md w-full p-6 space-y-4 shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-base font-bold text-gray-900">Adjust Inventory</h2>
                                <p className="text-xs text-gray-500 font-mono mt-0.5">
                                    {selectedProduct.name} ({selectedProduct.sku})
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedProduct(null)}
                                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="bg-gray-50 p-3 rounded text-xs space-y-1 font-mono border border-gray-200">
                            <div>Total Physical Stock: {selectedProduct.stock}</div>
                            <div>Active Reservations: {selectedProduct.reservedStock || 0}</div>
                            <div>Currently Available: {selectedProduct.availableStock ?? (selectedProduct.stock - (selectedProduct.reservedStock || 0))}</div>
                        </div>

                        <form onSubmit={handleAdjustSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Adjustment Action
                                </label>
                                <select
                                    value={adjustAction}
                                    onChange={(e) => setAdjustAction(e.target.value)}
                                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm bg-white"
                                >
                                    <option value="add">Restock / Add Quantity</option>
                                    <option value="reduce">Reduce Quantity</option>
                                    <option value="set">Set Exact Total Stock</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    {adjustAction === "set" ? "New Total Stock Count" : "Quantity"}
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    value={adjustQuantity}
                                    onChange={(e) => setAdjustQuantity(e.target.value)}
                                    placeholder="Enter amount..."
                                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm font-mono"
                                />
                            </div>

                            <div className="flex justify-end space-x-2 pt-2 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setSelectedProduct(null)}
                                    className="px-4 py-1.5 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={adjusting}
                                    className="px-4 py-1.5 text-sm bg-gray-900 hover:bg-black text-white rounded font-medium disabled:opacity-50"
                                >
                                    {adjusting ? "Saving..." : "Apply Adjustment"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminInventoryPage;
