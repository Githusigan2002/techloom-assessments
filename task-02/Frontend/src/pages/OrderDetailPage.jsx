import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function OrderDetailPage() {
  const { id } = useParams();
  const { isAuthenticated, openAuthModal } = useAuth();

  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [cancelling, setCancelling] = useState(false);
  const [cancelFeedback, setCancelFeedback] = useState(null);

  const fetchOrderDetail = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/orders/${id}`);
      setOrder(res.order);
      setPayment(res.payment);
    } catch (err) {
      setError(err.message || 'Unable to retrieve order details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [id, isAuthenticated]);

  const handleCancelOrder = async () => {
    const confirmCancel = window.confirm('Are you sure you want to cancel this order?');
    if (!confirmCancel) return;

    setCancelling(true);
    setCancelFeedback(null);
    try {
      const res = await api.post(`/orders/${id}/cancel`);
      setCancelFeedback({
        type: 'success',
        text: 'Your order has been cancelled. Refund processed successfully.',
      });
      await fetchOrderDetail();
    } catch (err) {
      setCancelFeedback({
        type: 'error',
        text: err.message || 'Could not cancel order.',
      });
    } finally {
      setCancelling(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="page-placeholder">
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>Sign In to View Order Details</h1>
        <button onClick={() => openAuthModal('login')} className="btn btn-primary">
          Sign In
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-grid-container" style={{ minHeight: '50vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>
          Loading order details...
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="page-placeholder">
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Order Not Found</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          {error || 'The requested order could not be located.'}
        </p>
        <Link to="/orders" className="btn btn-secondary">
          Back to My Orders
        </Link>
      </div>
    );
  }

  const isCancelled = order.status === 'cancelled';

  return (
    <div className="order-detail-page">
      {/* Breadcrumb Navigation */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/orders" className="btn btn-secondary btn-sm" id="btn-back-to-orders">
          &larr; Back to All Orders
        </Link>
      </div>

      {cancelFeedback && (
        <div
          className={`alert-banner ${cancelFeedback.type === 'success' ? 'success' : 'error'}`}
          style={{ marginBottom: '1.5rem' }}
        >
          <span>{cancelFeedback.text}</span>
        </div>
      )}

      {/* Main Order Card */}
      <div className="receipt-layout-grid">
        <div className="receipt-card">
          <div className="receipt-header-row">
            <div>
              <span className="receipt-meta-label">Order Details</span>
              <div className="receipt-order-id">#{order._id}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="receipt-meta-label">Placed On</span>
              <div className="receipt-meta-val">
                {new Date(order.createdAt).toLocaleDateString()} at{' '}
                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          <div className="receipt-status-badges">
            <span className={`badge-receipt status-${order.status}`}>
              Status: {order.status.toUpperCase()}
            </span>
            <span className={`badge-receipt payment-${order.paymentStatus}`}>
              Payment: {order.paymentStatus.toUpperCase()}
            </span>
            <span className="badge-receipt reservation-consumed">
              Reservation: {order.reservationStatus.toUpperCase()}
            </span>
          </div>

          <div className="summary-divider"></div>

          {/* Itemized list */}
          <h2 style={{ fontSize: '1.05rem', marginBottom: '0.85rem' }}>Items in this Order</h2>
          <div className="receipt-items-table">
            {order.items?.map((item) => (
              <div key={item._id} className="receipt-item-row" style={{ padding: '0.5rem 0' }}>
                <div>
                  <div className="receipt-item-name">{item.name}</div>
                  <div className="receipt-item-qty">
                    Qty: {item.quantity} × ${item.price.toFixed(2)}
                  </div>
                </div>
                <div className="receipt-item-price">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <div className="summary-divider"></div>

          <div className="summary-rows" style={{ marginBottom: 0 }}>
            <div className="summary-row total-row">
              <span className="total-label">Grand Total</span>
              <span className="total-val">${order.totalAmount?.toFixed(2)}</span>
            </div>
          </div>

          {payment && (
            <div className="payment-meta-box">
              <div>
                <strong>Payment Ref:</strong> <code>{payment.paymentId}</code>
                {payment.refundId && (
                  <div style={{ marginTop: '0.2rem', color: 'var(--success-text)' }}>
                    Refund Ref: <code>{payment.refundId}</code> ($
                    {payment.refundedAmount?.toFixed(2)} refunded)
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Actions & Address */}
        <div className="receipt-side-column">
          <div className="receipt-side-card">
            <h3 style={{ fontSize: '0.95rem', margin: '0 0 0.5rem 0' }}>Shipping Destination</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.45 }}>
              {order.shippingAddress?.street || 'Standard Shipping'}<br />
              {order.shippingAddress?.city && `${order.shippingAddress.city}, `}
              {order.shippingAddress?.state} {order.shippingAddress?.postalCode}<br />
              {order.shippingAddress?.country || 'USA'}
            </p>
          </div>

          <div className="receipt-side-card">
            <h3 style={{ fontSize: '0.95rem', marginBottom: '0.65rem' }}>Order Actions</h3>
            {!isCancelled ? (
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="btn btn-secondary"
                style={{ width: '100%', borderColor: 'var(--danger-border)', color: 'var(--danger-text)' }}
                id="btn-detail-cancel-order"
              >
                {cancelling ? 'Restocking Items...' : 'Cancel Order & Refund'}
              </button>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                This order is cancelled and items have been refunded.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
