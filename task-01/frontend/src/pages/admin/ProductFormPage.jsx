import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { productService } from "../../services/productService";
import Alert from "../../components/common/Alert";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export const ProductFormPage = () => {
    const { id } = useParams();
    const isEditMode = Boolean(id);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        sku: "",
        category: "General",
        price: "",
        stock: "",
        description: "",
    });

    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(isEditMode);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isEditMode) {
            const loadProduct = async () => {
                try {
                    setPageLoading(true);
                    const data = await productService.getProductById(id);
                    const p = data.product;
                    setFormData({
                        name: p.name || "",
                        sku: p.sku || "",
                        category: p.category || "General",
                        price: p.price ?? "",
                        stock: p.stock ?? "",
                        description: p.description || "",
                    });
                } catch (err) {
                    console.error("Failed to load product for editing:", err);
                    setError("Unable to load product data");
                } finally {
                    setPageLoading(false);
                }
            };
            loadProduct();
        }
    }, [id, isEditMode]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!formData.name.trim()) {
            setError("Product Name is required");
            return;
        }

        if (!formData.sku.trim()) {
            setError("Product SKU is required");
            return;
        }

        const priceNum = parseFloat(formData.price);
        if (isNaN(priceNum) || priceNum < 0) {
            setError("Price must be a non-negative number");
            return;
        }

        const stockNum = parseInt(formData.stock, 10);
        if (isNaN(stockNum) || stockNum < 0) {
            setError("Stock quantity must be a non-negative number");
            return;
        }

        try {
            setLoading(true);
            const payload = {
                ...formData,
                price: priceNum,
                stock: stockNum,
            };

            if (isEditMode) {
                await productService.updateProduct(id, payload);
            } else {
                await productService.createProduct(payload);
            }

            navigate("/admin/products");
        } catch (err) {
            console.error("Save failed:", err);
            setError(err.response?.data?.message || "Failed to save product. Check for duplicate SKU.");
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) {
        return <LoadingSpinner text="Loading product details..." />;
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white p-4 border border-gray-200 rounded flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                        {isEditMode ? "Edit Product" : "Add New Product"}
                    </h1>
                    <p className="text-xs text-gray-500">Enter product information and inventory stock levels</p>
                </div>
                <Link
                    to="/admin/products"
                    className="text-xs text-gray-600 border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded"
                >
                    Cancel
                </Link>
            </div>

            <Alert type="error" message={error} onClose={() => setError("")} />

            <div className="bg-white border border-gray-200 rounded p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Product Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g. Wireless Barcode Scanner"
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                SKU Code <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="sku"
                                required
                                value={formData.sku}
                                onChange={handleChange}
                                placeholder="e.g. BARCODE-001"
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm uppercase font-mono focus:outline-none focus:ring-1 focus:ring-gray-900"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                            <input
                                type="text"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                placeholder="General"
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Unit Price (Rs.) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                name="price"
                                required
                                value={formData.price}
                                onChange={handleChange}
                                placeholder="0.00"
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-gray-900"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Stock Quantity <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="0"
                                name="stock"
                                required
                                value={formData.stock}
                                onChange={handleChange}
                                placeholder="0"
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-gray-900"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                        <textarea
                            name="description"
                            rows={3}
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Optional product description..."
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                        />
                    </div>

                    <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
                        <Link
                            to="/admin/products"
                            className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded text-sm font-medium"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-gray-900 hover:bg-black text-white px-5 py-2 rounded text-sm font-semibold transition-colors disabled:opacity-50"
                        >
                            {loading ? "Saving..." : isEditMode ? "Save Changes" : "Create Product"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductFormPage;
