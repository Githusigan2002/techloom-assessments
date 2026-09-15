import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function OrdersPage() {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelMessage, setCancelMessage] = useState(null);

  const fetchOrders = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get('/orders/my-orders');
      setOrders(res.orders || []);
    } catch (err) {
      // Handled by loading/empty state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [isAuthenticated]);

  // Phase 12: Cancel order & process mock refund with stock restock
  const handleCancelOrder = async (orderId) => {
    const confirmCancel = window.confirm('Are you sure you want to cancel this order?');
    if (!confirmCancel) return;

    setCancellingId(orderId);
    setCancelMessage(null);

    try {
      const res = await api.post(`/orders/${orderId}/cancel`);
      setCancelMessage({
        type: 'success',
        text: 'Your order has been cancelled. Refund processed successfully.',
      });
      await fetchOrders();
    } catch (err) {
      setCancelMessage({
        type: 'error',
        text: err.message || 'Failed to cancel order.',
      });
    } finally {
      setCancellingId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="page-placeholder">
        <h1 style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>View Your Order History</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 2rem' }}>
          Please sign in to view your past purchases, track mock payments, and manage cancellations.
        </p>
        <button onClick={() => openAuthModal('login')} className="btn btn-primary">
          Sign In
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-grid-container" style={{ minHeight: '50vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading order history...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="page-placeholder">
        <h1 style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>No Orders Found</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 2rem' }}>
          You haven't placed any storefront orders yet. Start exploring our product catalog to complete your first purchase.
        </p>
        <Link to="/products" className="btn btn-primary">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="orders-page-header">
        <div>
          <h1 className="orders-title">My Orders</h1>
          <p className="orders-subtitle">
            View your order history and track past purchases.
          </p>
        </div>
      </div>

      {cancelMessage && (
        <div
          className={`alert-banner ${cancelMessage.type === 'success' ? 'success' : 'error'}`}
          style={{ marginBottom: '2rem' }}
        >
          <span>{cancelMessage.text}</span>
        </div>
      )}

      <div className="orders-list">
        {orders.map((order) => {
          const isCancelled = order.status === 'cancelled';
          const isPaid = order.paymentStatus === 'paid';
          const isRefunded = order.paymentStatus === 'refunded';
          const isCancelling = cancellingId === order._id;

          return (
            <div key={order._id} className="order-history-card" id={`order-card-${order._id}`}>
              {/* Card Header */}
              <div className="order-card-header">
                <div className="order-id-group">
                  <span className="order-number-title">Order #{order._id}</span>
                  <div className="order-date-text">
                    <span>
                      {new Date(order.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="order-badges-group">
                  <span className={`order-status-pill status-${order.status}`}>
                    {order.status.toUpperCase()}
                  </span>
                  <span className={`order-status-pill payment-${order.paymentStatus}`}>
                    {order.paymentStatus.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="order-items-list">
                {order.items?.map((item) => (
                  <div key={item._id} className="order-item-row">
                    <div className="order-item-info">
                      <span className="order-item-name">{item.name}</span>
                      <span className="order-item-sub">
                        Qty: {item.quantity} × ${item.price.toFixed(2)}
                      </span>
                    </div>
                    <div className="order-item-price">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Card Footer: Total and Actions */}
              <div className="order-card-footer">
                <div className="order-footer-total">
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total:</span>{' '}
                  <strong style={{ fontSize: '1.15rem', color: 'var(--text-primary)' }}>${order.totalAmount.toFixed(2)}</strong>
                </div>

                <div className="order-footer-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Link
                    to={`/orders/${order._id}`}
                    className="btn btn-secondary btn-sm"
                    id={`btn-view-order-${order._id}`}
                  >
                    View Details
                  </Link>

                  {/* Phase 12: Cancellation & Refund Action */}
                  {!isCancelled && (
                    <button
                      onClick={() => handleCancelOrder(order._id)}
                      disabled={isCancelling}
                      className="btn-cancel-order"
                      id={`btn-cancel-order-${order._id}`}
                      title="Cancel order and trigger mock refund & stock restock"
                    >
                      {isCancelling ? 'Restocking...' : 'Cancel Order & Refund'}
                    </button>
                  )}

                  {isRefunded && (
                    <span className="refunded-notice-pill">
                      Refunded & Restocked
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
