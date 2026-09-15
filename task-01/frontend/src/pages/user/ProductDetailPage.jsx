import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { productService } from "../../services/productService";
import { useCart } from "../../context/CartContext";
import { formatCurrency } from "../../utils/formatters";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Alert from "../../components/common/Alert";
import StatusBadge from "../../components/common/StatusBadge";

export const ProductDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                setError("");
                const data = await productService.getProductById(id);
                setProduct(data.product);
            } catch (err) {
                console.error("Failed to load product details:", err);
                setError(err.response?.data?.message || "Failed to load product details.");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProduct();
        }
    }, [id]);

    const handleAddToCart = async () => {
        if (!product) return;
        try {
            setAdding(true);
            setError("");
            setSuccessMessage("");
            await addToCart(product._id, quantity);
            setSuccessMessage(`Added ${quantity} &times; "${product.name}" to cart.`);
        } catch (err) {
            console.error("Failed to add to cart:", err);
            setError(err.response?.data?.message || err.message || "Failed to add product to cart.");
        } finally {
            setAdding(false);
        }
    };

    if (loading) {
        return <LoadingSpinner text="Loading product information..." />;
    }

    if (error && !product) {
        return (
            <div className="max-w-2xl mx-auto space-y-4">
                <Alert type="error" message={error} onClose={() => setError("")} />
                <Link to="/products" className="text-sm text-gray-600 hover:underline inline-block">
                    ← Back to Product Catalog
                </Link>
            </div>
        );
    }

    if (!product) {
        return null;
    }

    const available = product.availableStock !== undefined
        ? product.availableStock
        : product.stock - (product.reservedStock || 0);
    const isOutOfStock = available <= 0;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Top Navigation */}
            <div>
                <Link
                    to="/products"
                    className="text-xs text-gray-500 hover:text-gray-900 font-medium inline-flex items-center"
                >
                    ← Back to Products
                </Link>
            </div>

            {/* Notification Alerts */}
            {successMessage && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded text-sm flex justify-between items-center">
                    <span>{successMessage}</span>
                    <Link
                        to="/cart"
                        className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded font-semibold ml-4 whitespace-nowrap"
                    >
                        View Cart →
                    </Link>
                </div>
            )}
            {error && <Alert type="error" message={error} onClose={() => setError("")} />}

            {/* Product Card */}
            <div className="bg-white border border-gray-200 rounded p-6 space-y-6">
                {/* Header info */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3 border-b border-gray-100 pb-5">
                    <div>
                        <div className="flex items-center space-x-2 mb-1.5">
                            {product.category && (
                                <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-700 rounded uppercase tracking-wider">
                                    {product.category}
                                </span>
                            )}
                            <span className="text-xs font-mono text-gray-400">
                                SKU: {product.sku}
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                            {product.name}
                        </h1>
                    </div>

                    <div>
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
                </div>

                {/* Pricing & Stock Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded border border-gray-100">
                    <div>
                        <span className="text-xs text-gray-500 block">Unit Price</span>
                        <span className="text-3xl font-bold font-mono text-gray-900">
                            {formatCurrency(product.price)}
                        </span>
                    </div>

                    <div className="space-y-1 text-xs sm:text-right">
                        <div className="text-gray-600">
                            Available for Purchase:{" "}
                            <strong className="font-mono text-sm text-gray-900">{available}</strong>
                        </div>
                        {product.reservedStock > 0 && (
                            <div className="text-amber-700">
                                Locked in Active Checkouts:{" "}
                                <strong className="font-mono">{product.reservedStock}</strong>
                            </div>
                        )}
                        <div className="text-gray-400">
                            Total Physical Inventory: {product.stock}
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <h2 className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-2">
                        Product Description
                    </h2>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                        {product.description || "No description provided for this product."}
                    </p>
                </div>

                {/* Action Controls */}
                <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-4">
                    {/* Quantity Selector */}
                    <div className="flex items-center space-x-3 w-full sm:w-auto">
                        <span className="text-xs text-gray-600 font-medium">Quantity:</span>
                        <div className="flex items-center border border-gray-300 rounded">
                            <button
                                type="button"
                                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                disabled={isOutOfStock || quantity <= 1 || adding}
                                className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                            >
                                -
                            </button>
                            <span className="w-10 text-center font-mono font-medium text-sm">
                                {quantity}
                            </span>
                            <button
                                type="button"
                                onClick={() => setQuantity((q) => Math.min(available, q + 1))}
                                disabled={isOutOfStock || quantity >= available || adding}
                                className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                        type="button"
                        onClick={handleAddToCart}
                        disabled={isOutOfStock || adding}
                        className={`flex-1 py-2.5 px-6 rounded text-sm font-semibold transition-colors w-full sm:w-auto ${
                            isOutOfStock
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                                : "bg-gray-900 hover:bg-black text-white"
                        }`}
                    >
                        {adding
                            ? "Adding to Cart..."
                            : isOutOfStock
                            ? "Currently Out of Stock"
                            : `Add to Cart • ${formatCurrency(product.price * quantity)}`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailPage;
