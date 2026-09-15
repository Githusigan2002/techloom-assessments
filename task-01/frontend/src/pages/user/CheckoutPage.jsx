import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { orderService } from "../../services/orderService";
import { paymentService } from "../../services/paymentService";
import { formatCurrency } from "../../utils/formatters";
import Alert from "../../components/common/Alert";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import StatusBadge from "../../components/common/StatusBadge";

export const CheckoutPage = () => {
    const { cart, fetchCart } = useCart();
    const navigate = useNavigate();
    const location = useLocation();

    // Initialize order from direct navigation if available
    const [order, setOrder] = useState(location.state?.order || null);
    const [loading, setLoading] = useState(false);
    const [paying, setPaying] = useState(false);
    const [error, setError] = useState("");
    const [paymentResult, setPaymentResult] = useState(null);

    // Mock payment options
    const [outcome, setOutcome] = useState("SUCCESS");
    const [paymentMethod, setPaymentMethod] = useState("CARD");

    // Countdown state (in seconds)
    const [timeLeft, setTimeLeft] = useState(null);

    // If user refreshes the page, recover their active 5-minute reservation
    useEffect(() => {
        const checkActiveReservation = async () => {
            if (order) return;
            try {
                const res = await orderService.getUserOrders();
                const activeOrder = (res.orders || []).find(
                    (o) => o.status === "RESERVED" && new Date(o.expiresAt) > new Date()
                );
                if (activeOrder) {
                    setOrder(activeOrder);
                }
            } catch (err) {
                console.error("Failed to restore active reservation:", err);
            }
        };

        checkActiveReservation();
    }, [order]);

    const handleStartReservation = async () => {
        try {
            setLoading(true);
            setError("");
            const idempotencyKey = `CHK-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
            const data = await orderService.checkout(idempotencyKey);
            setOrder(data.order);
            await fetchCart();
        } catch (err) {
            console.error("Checkout reservation failed:", err);
            setError(err.response?.data?.message || err.message || "Failed to reserve stock for checkout.");
        } finally {
            setLoading(false);
        }
    };

    // Calculate time left on 5-minute stock lock
    useEffect(() => {
        if (!order?.expiresAt) return;

        const calculateRemaining = () => {
            const difference = new Date(order.expiresAt) - new Date();
            return Math.max(0, Math.floor(difference / 1000));
        };

        setTimeLeft(calculateRemaining());

        const interval = setInterval(() => {
            const remaining = calculateRemaining();
            setTimeLeft(remaining);

            if (remaining <= 0) {
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [order?.expiresAt]);

    const formatTime = (seconds) => {
        if (seconds === null) return "--:--";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };

    // Send payment request to backend mock gateway
    const handleProcessPayment = async () => {
        if (!order) return;

        try {
            setPaying(true);
            setError("");
            const idempotencyKey = `PAY-${order._id}-${Date.now()}`;
            const data = await paymentService.processPayment(
                order._id,
                outcome,
                idempotencyKey,
                paymentMethod
            );

            setPaymentResult(data);
            setOrder(data.order);
        } catch (err) {
            console.error("Payment error:", err);
            setError(err.response?.data?.message || "Payment failed to process");
        } finally {
            setPaying(false);
        }
    };

    const isExpired = timeLeft !== null && timeLeft <= 0;
    const isCartEmpty = (!cart?.items || cart.items.length === 0) && !order;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white p-4 border border-gray-200 rounded">
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Checkout & Payment</h1>
                <p className="text-xs text-gray-500">Atomic stock reservation and payment processing</p>
            </div>

            <Alert type="error" message={error} onClose={() => setError("")} />

            {/* Empty cart warning */}
            {isCartEmpty && !paymentResult && (
                <div className="bg-white border border-gray-200 rounded p-10 text-center">
                    <p className="text-gray-500 text-sm mb-4">You have no items to checkout.</p>
                    <Link
                        to="/products"
                        className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded text-sm font-medium"
                    >
                        Browse Products
                    </Link>
                </div>
            )}

            {/* Order review before reserving */}
            {!order && !isCartEmpty && !paymentResult && (
                <div className="bg-white border border-gray-200 rounded p-6 space-y-6">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900 mb-3">Order Summary</h2>
                        <ul className="divide-y divide-gray-200 text-sm">
                            {cart.items.map((item) => (
                                <li key={item.product?._id || item.product} className="py-2 flex justify-between">
                                    <span>
                                        {item.name} &times; {item.quantity}
                                    </span>
                                    <span className="font-mono font-medium">
                                        {formatCurrency(item.price * item.quantity)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                        <div className="pt-4 border-t border-gray-200 flex justify-between font-bold text-base mt-3">
                            <span>Total Due</span>
                            <span className="font-mono">{formatCurrency(cart.totalAmount)}</span>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-800">
                        Clicking <strong>Reserve Stock & Continue</strong> will atomically lock items in the database
                        for 5 minutes while you complete mock payment.
                    </div>

                    <div className="flex justify-between items-center pt-2">
                        <Link to="/cart" className="text-sm text-gray-600 hover:underline">
                            ← Edit Cart
                        </Link>
                        <button
                            type="button"
                            onClick={handleStartReservation}
                            disabled={loading}
                            className="bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded text-sm font-semibold transition-colors disabled:opacity-50"
                        >
                            {loading ? "Reserving Stock..." : "Reserve Stock & Continue →"}
                        </button>
                    </div>
                </div>
            )}

            {/* Active Reservation & Mock Payment */}
            {order && !paymentResult && (
                <div className="space-y-6">
                    {/* Live Reservation Banner */}
                    <div
                        className={`p-4 rounded border flex items-center justify-between ${
                            isExpired
                                ? "bg-red-50 border-red-300 text-red-800"
                                : "bg-amber-50 border-amber-300 text-amber-900"
                        }`}
                    >
                        <div>
                            <span className="text-xs font-semibold uppercase tracking-wider block">
                                Stock Lock Status
                            </span>
                            <span className="text-sm font-medium">
                                {isExpired
                                    ? "Reservation expired! Stock has been returned to inventory."
                                    : `Items are reserved for: `}
                            </span>
                        </div>

                        <div className="text-right">
                            <span className="font-mono text-2xl font-bold tracking-tight">
                                {isExpired ? "00:00" : formatTime(timeLeft)}
                            </span>
                            {!isExpired && (
                                <span className="text-xs text-amber-700 block">5-minute timer</span>
                            )}
                        </div>
                    </div>

                    {/* Order Details Preview */}
                    <div className="bg-white border border-gray-200 rounded p-6 space-y-4">
                        <div className="flex justify-between items-start pb-4 border-b border-gray-200">
                            <div>
                                <span className="text-xs text-gray-400 font-mono block">Order ID</span>
                                <span className="font-mono font-bold text-gray-900">{order.orderNumber}</span>
                            </div>
                            <StatusBadge status={isExpired ? "EXPIRED" : order.status} />
                        </div>

                        <ul className="divide-y divide-gray-100 text-sm">
                            {order.items.map((item, idx) => (
                                <li key={idx} className="py-2 flex justify-between">
                                    <span>
                                        {item.name} &times; {item.quantity}
                                    </span>
                                    <span className="font-mono">{formatCurrency(item.itemTotal)}</span>
                                </li>
                            ))}
                        </ul>

                        <div className="pt-3 border-t border-gray-200 flex justify-between font-bold text-base">
                            <span>Amount to Pay</span>
                            <span className="font-mono">{formatCurrency(order.totalAmount)}</span>
                        </div>
                    </div>

                    {/* Mock Payment Selector */}
                    <div className="bg-white border border-gray-200 rounded p-6 space-y-4">
                        <h2 className="text-base font-semibold text-gray-900">Mock Payment Gateway Simulation</h2>
                        <p className="text-xs text-gray-500">
                            Test backend state transitions and inventory release by selecting an outcome:
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                            <label
                                className={`border p-3 rounded cursor-pointer text-sm flex flex-col items-center justify-center transition-colors ${
                                    outcome === "SUCCESS"
                                        ? "border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold"
                                        : "border-gray-300 hover:bg-gray-50"
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="outcome"
                                    value="SUCCESS"
                                    checked={outcome === "SUCCESS"}
                                    onChange={(e) => setOutcome(e.target.value)}
                                    className="sr-only"
                                />
                                <span>Success</span>
                                <span className="text-xs text-gray-500 font-normal mt-0.5">Confirms order & sales</span>
                            </label>

                            <label
                                className={`border p-3 rounded cursor-pointer text-sm flex flex-col items-center justify-center transition-colors ${
                                    outcome === "FAILED"
                                        ? "border-rose-600 bg-rose-50 text-rose-900 font-semibold"
                                        : "border-gray-300 hover:bg-gray-50"
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="outcome"
                                    value="FAILED"
                                    checked={outcome === "FAILED"}
                                    onChange={(e) => setOutcome(e.target.value)}
                                    className="sr-only"
                                />
                                <span>Failure</span>
                                <span className="text-xs text-gray-500 font-normal mt-0.5">Releases stock immediately</span>
                            </label>

                            <label
                                className={`border p-3 rounded cursor-pointer text-sm flex flex-col items-center justify-center transition-colors ${
                                    outcome === "TIMEOUT"
                                        ? "border-amber-600 bg-amber-50 text-amber-900 font-semibold"
                                        : "border-gray-300 hover:bg-gray-50"
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="outcome"
                                    value="TIMEOUT"
                                    checked={outcome === "TIMEOUT"}
                                    onChange={(e) => setOutcome(e.target.value)}
                                    className="sr-only"
                                />
                                <span>Timeout</span>
                                <span className="text-xs text-gray-500 font-normal mt-0.5">Expires hold & releases</span>
                            </label>
                        </div>

                        <div className="pt-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Payment Method</label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="w-full sm:w-48 px-3 py-1.5 border border-gray-300 rounded text-sm bg-white"
                            >
                                <option value="CARD">Credit / Debit Card</option>
                                <option value="CASH">Cash</option>
                                <option value="TERMINAL">POS Terminal</option>
                            </select>
                        </div>

                        <div className="pt-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={handleProcessPayment}
                                disabled={paying || isExpired}
                                className={`w-full py-3 rounded text-sm font-semibold text-white transition-colors disabled:opacity-50 ${
                                    isExpired
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : outcome === "SUCCESS"
                                        ? "bg-emerald-600 hover:bg-emerald-700"
                                        : outcome === "FAILED"
                                        ? "bg-rose-600 hover:bg-rose-700"
                                        : "bg-amber-600 hover:bg-amber-700"
                                }`}
                            >
                                {paying
                                    ? "Processing with Backend Gateway..."
                                    : isExpired
                                    ? "Reservation Expired (Cannot Pay)"
                                    : `Pay ${formatCurrency(order.totalAmount)} (${outcome})`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Result */}
            {paymentResult && (
                <div className="bg-white border border-gray-200 rounded p-8 text-center space-y-4">
                    <div className="inline-flex p-3 rounded-full bg-gray-100 mb-2">
                        {paymentResult.payment?.status === "SUCCESS" ? (
                            <span className="text-3xl">✓</span>
                        ) : paymentResult.payment?.status === "TIMEOUT" ? (
                            <span className="text-3xl">⏱</span>
                        ) : (
                            <span className="text-3xl">✕</span>
                        )}
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                        {paymentResult.payment?.status === "SUCCESS"
                            ? "Payment Successful"
                            : paymentResult.payment?.status === "TIMEOUT"
                            ? "Payment Timed Out"
                            : "Payment Failed"}
                    </h2>

                    <p className="text-sm text-gray-600 max-w-md mx-auto">
                        {paymentResult.payment?.status === "SUCCESS"
                            ? `Your order #${order?.orderNumber} has been paid and confirmed. Stock is permanently deducted.`
                            : paymentResult.payment?.status === "TIMEOUT"
                            ? "The 5-minute reservation timer elapsed. Reserved items were released back to available stock."
                            : "Payment simulation ended with failure. Held stock was immediately returned to inventory."}
                    </p>

                    <div className="bg-gray-50 border border-gray-200 rounded p-4 max-w-md mx-auto text-left text-xs font-mono space-y-1 my-4">
                        <div>Transaction ID: {paymentResult.payment?.transactionId}</div>
                        <div>Status: {paymentResult.payment?.status}</div>
                        <div>Amount: {formatCurrency(paymentResult.payment?.amount)}</div>
                    </div>

                    <div className="flex justify-center space-x-4 pt-4">
                        <Link
                            to={`/orders/${order?._id}`}
                            className="bg-gray-900 hover:bg-black text-white px-5 py-2 rounded text-sm font-medium"
                        >
                            View Order Details
                        </Link>
                        <Link
                            to="/products"
                            className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-5 py-2 rounded text-sm font-medium"
                        >
                            Back to Store
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CheckoutPage;
