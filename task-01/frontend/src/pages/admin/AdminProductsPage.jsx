import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { productService } from "../../services/productService";
import { formatCurrency } from "../../utils/formatters";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Alert from "../../components/common/Alert";

export const AdminProductsPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [search, setSearch] = useState("");
    const navigate = useNavigate();

    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError("");
            const params = search.trim() ? { search: search.trim() } : {};
            const data = await productService.getAllProducts(params);
            setProducts(data.products || []);
        } catch (err) {
            console.error("Failed to load products:", err);
            setError("Unable to load products from database.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => fetchProducts(), 300);
        return () => clearTimeout(timeout);
    }, [search]);

    const handleDelete = async (productId, productName) => {
        if (!window.confirm(`Are you sure you want to delete product "${productName}"?`)) {
            return;
        }

        try {
            setError("");
            setSuccessMessage("");
            await productService.deleteProduct(productId);
            setProducts(products.filter((p) => p._id !== productId));
            setSuccessMessage(`Product "${productName}" was deleted.`);
        } catch (err) {
            console.error("Delete failed:", err);
            setError(err.response?.data?.message || "Failed to delete product.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 border border-gray-200 rounded gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">Product Management</h1>
                    <p className="text-xs text-gray-500">Create, edit, or remove catalog products</p>
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search product or SKU..."
                        className="px-3 py-1.5 border border-gray-300 rounded text-sm w-full sm:w-56 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                    <Link
                        to="/admin/products/new"
                        className="bg-gray-900 hover:bg-black text-white px-4 py-1.5 rounded text-sm font-semibold whitespace-nowrap transition-colors"
                    >
                        + Add Product
                    </Link>
                </div>
            </div>

            {successMessage && <Alert type="success" message={successMessage} onClose={() => setSuccessMessage("")} />}
            {error && <Alert type="error" message={error} onClose={() => setError("")} />}

            {loading ? (
                <LoadingSpinner text="Loading product inventory..." />
            ) : products.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded p-12 text-center text-gray-500 text-sm">
                    No products found. Click "+ Add Product" to create one.
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                <tr>
                                    <th className="py-3 px-4">Product Name</th>
                                    <th className="py-3 px-4 font-mono">SKU</th>
                                    <th className="py-3 px-4">Category</th>
                                    <th className="py-3 px-4 text-right">Price</th>
                                    <th className="py-3 px-4 text-center">Physical Stock</th>
                                    <th className="py-3 px-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {products.map((product) => (
                                    <tr key={product._id} className="hover:bg-gray-50">
                                        <td className="py-3 px-4 font-medium text-gray-900">{product.name}</td>
                                        <td className="py-3 px-4 font-mono text-xs text-gray-500">{product.sku}</td>
                                        <td className="py-3 px-4 text-gray-600 text-xs">{product.category || "General"}</td>
                                        <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">
                                            {formatCurrency(product.price)}
                                        </td>
                                        <td className="py-3 px-4 text-center font-mono font-medium text-gray-800">
                                            {product.stock}
                                        </td>
                                        <td className="py-3 px-4 text-center space-x-2">
                                            <button
                                                type="button"
                                                onClick={() => navigate(`/admin/products/${product._id}/edit`)}
                                                className="text-xs text-blue-600 hover:text-blue-900 border border-blue-200 hover:bg-blue-50 px-2.5 py-1 rounded font-medium"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(product._id, product.name)}
                                                className="text-xs text-red-600 hover:text-red-900 border border-red-200 hover:bg-red-50 px-2.5 py-1 rounded font-medium"
                                            >
                                                Delete
                                            </button>
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

export default AdminProductsPage;
