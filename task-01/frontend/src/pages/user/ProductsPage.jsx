import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { productService } from "../../services/productService";
import { useCart } from "../../context/CartContext";
import { formatCurrency } from "../../utils/formatters";
import Alert from "../../components/common/Alert";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import StatusBadge from "../../components/common/StatusBadge";

export const ProductsPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("");
    const [inStockOnly, setInStockOnly] = useState(false);
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [addingId, setAddingId] = useState(null);

    const { addToCart } = useCart();

    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError("");
            const params = {};
            if (search.trim()) params.search = search.trim();
            if (category) params.category = category;
            if (inStockOnly) params.inStock = "true";
            if (minPrice !== "") params.minPrice = minPrice;
            if (maxPrice !== "") params.maxPrice = maxPrice;

            const data = await productService.getAllProducts(params);
            setProducts(data.products || []);
        } catch (err) {
            console.error("Failed to load products:", err);
            setError("Unable to load products. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchProducts();
        }, 300); // Debounce search and price filter

        return () => clearTimeout(timeoutId);
    }, [search, category, inStockOnly, minPrice, maxPrice]);

    const handleAddToCart = async (product) => {
        try {
            setAddingId(product._id);
            setSuccessMessage("");
            setError("");
            await addToCart(product._id, 1);
            setSuccessMessage(`Added "${product.name}" to cart.`);
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (err) {
            console.error("Add to cart failed:", err);
            setError(err.response?.data?.message || err.message || "Failed to add item to cart.");
        } finally {
            setAddingId(null);
        }
    };

    const handleClearFilters = () => {
        setSearch("");
        setCategory("");
        setInStockOnly(false);
        setMinPrice("");
        setMaxPrice("");
    };

    const hasActiveFilters = search || category || inStockOnly || minPrice !== "" || maxPrice !== "";

    // Extract unique categories for filter
    const categories = ["All", ...new Set(products.map((p) => p.category).filter(Boolean))];

    return (
        <div className="space-y-6">
            {/* Header & Filter Controls */}
            <div className="bg-white p-4 border border-gray-200 rounded space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Product Catalog</h1>
                        <p className="text-xs text-gray-500">Browse and add items to your active POS cart</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                        {/* Search Input */}
                        <div className="relative">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name or SKU..."
                                className="w-full sm:w-56 px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch("")}
                                    className="absolute right-2.5 top-2 text-xs text-gray-400 hover:text-gray-600"
                                >
                                    &times;
                                </button>
                            )}
                        </div>

                        {/* Category Dropdown */}
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value === "All" ? "" : e.target.value)}
                            className="px-3 py-1.5 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-900"
                        >
                            <option value="">All Categories</option>
                            {categories.filter((c) => c !== "All").map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Sub-filters: Price Range & In-Stock Switch */}
                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 text-xs">
                    <span className="text-gray-500 font-medium">Filter by:</span>

                    {/* Price Range */}
                    <div className="flex items-center space-x-1.5">
                        <span className="text-gray-500">Price:</span>
                        <input
                            type="number"
                            min="0"
                            placeholder="Min Rs."
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-xs"
                        />
                        <span className="text-gray-400">-</span>
                        <input
                            type="number"
                            min="0"
                            placeholder="Max Rs."
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-xs"
                        />
                    </div>

                    {/* Availability checkbox */}
                    <label className="flex items-center space-x-1.5 cursor-pointer ml-2">
                        <input
                            type="checkbox"
                            checked={inStockOnly}
                            onChange={(e) => setInStockOnly(e.target.checked)}
                            className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                        />
                        <span className="text-gray-700 font-medium">In Stock Only</span>
                    </label>

                    {/* Reset Button */}
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={handleClearFilters}
                            className="text-xs text-blue-600 hover:text-blue-800 underline ml-auto"
                        >
                            Reset Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Notification Alerts */}
            {successMessage && <Alert type="success" message={successMessage} onClose={() => setSuccessMessage("")} />}
            {error && <Alert type="error" message={error} onClose={() => setError("")} />}

            {/* Loading State */}
            {loading ? (
                <LoadingSpinner text="Loading products..." />
            ) : products.length === 0 ? (
                /* Empty State */
                <div className="bg-white border border-gray-200 rounded p-12 text-center text-gray-500 text-sm">
                    No products found matching your search or filters.
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={handleClearFilters}
                            className="block mx-auto mt-3 text-xs text-gray-900 font-medium underline"
                        >
                            Clear All Filters
                        </button>
                    )}
                </div>
            ) : (
                /* Main Product Grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {products.map((product) => {
                        const available = product.availableStock !== undefined
                            ? product.availableStock
                            : product.stock - (product.reservedStock || 0);
                        const isOutOfStock = available <= 0;

                        return (
                            <div
                                key={product._id}
                                className="bg-white border border-gray-200 rounded p-4 flex flex-col justify-between hover:border-gray-300 transition-colors"
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-xs font-mono text-gray-400 uppercase">
                                            {product.sku}
                                        </span>
                                        <StatusBadge
                                            status={
                                                isOutOfStock
                                                    ? "OUT OF STOCK"
                                                    : available <= 5
                                                    ? "LOW STOCK"
                                                    : "IN STOCK"
                                            }
                                        />
                                    </div>

                                    <Link
                                        to={`/products/${product._id}`}
                                        className="text-base font-semibold text-gray-900 mb-1 leading-snug hover:text-blue-600 transition-colors block"
                                    >
                                        {product.name}
                                    </Link>

                                    {product.description && (
                                        <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                                            {product.description}
                                        </p>
                                    )}
                                </div>

                                <div className="pt-3 border-t border-gray-100 mt-2">
                                    <div className="flex justify-between items-baseline mb-3">
                                        <span className="text-lg font-bold text-gray-900 font-mono">
                                            {formatCurrency(product.price)}
                                        </span>
                                        <span className="text-xs text-gray-600">
                                            Available: <strong className="font-semibold">{available}</strong>
                                        </span>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Link
                                            to={`/products/${product._id}`}
                                            className="px-2.5 py-2 text-xs border border-gray-300 hover:bg-gray-50 text-gray-700 rounded font-medium text-center"
                                        >
                                            Details
                                        </Link>

                                        <button
                                            type="button"
                                            onClick={() => handleAddToCart(product)}
                                            disabled={isOutOfStock || addingId === product._id}
                                            className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                                                isOutOfStock
                                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                                                    : "bg-gray-900 hover:bg-black text-white"
                                            }`}
                                        >
                                            {addingId === product._id
                                                ? "Adding..."
                                                : isOutOfStock
                                                ? "Out of Stock"
                                                : "Add to Cart"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ProductsPage;
