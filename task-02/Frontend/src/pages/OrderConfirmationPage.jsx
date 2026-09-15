import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import api from '../api/client';

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(location.state?.order || null);
  const [payment, setPayment] = useState(location.state?.payment || null);
  const [loading, setLoading] = useState(!order);

  useEffect(() => {
    if (!order) {
      api
        .get(`/orders/${id}`)
        .then((res) => {
          setOrder(res.order);
          setPayment(res.payment);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [id, order]);

  if (loading) {
    return (
      <div className="page-placeholder">
        <h2>Generating Order Receipt...</h2>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="page-placeholder">
        <h1>Order Not Found</h1>
        <Link to="/products" className="btn btn-primary">Return to Store</Link>
      </div>
    );
  }

  return (
    <div className="confirmation-page">
      <div className="confirmation-banner-card">
        <div className="confirmation-tag">Payment Confirmed</div>
        <h1 className="confirmation-title">Thank You for Your Order!</h1>
        <p className="confirmation-subtitle">
          Your payment was processed successfully and your order has been placed.
        </p>
      </div>

      <div className="receipt-layout-grid">
        {/* Receipt Details Card */}
        <div className="receipt-card">
          <div className="receipt-header-row">
            <div>
              <span className="receipt-meta-label">Order Number</span>
              <div className="receipt-order-id">#{order._id}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="receipt-meta-label">Order Date</span>
              <div className="receipt-meta-val">
                {new Date(order.createdAt).toLocaleDateString()} at{' '}
                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          <div className="receipt-status-badges">
            <span className="badge-receipt status-completed">
              Status: {order.status.toUpperCase()}
            </span>
            <span className="badge-receipt payment-paid">
              Payment: {order.paymentStatus.toUpperCase()}
            </span>
            <span className="badge-receipt reservation-consumed">
              Reservation: {order.reservationStatus.toUpperCase()}
            </span>
          </div>

          <div className="summary-divider"></div>

          {/* Purchased Line Items */}
          <h2 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Purchased Items</h2>
          <div className="receipt-items-table">
            {order.items?.map((item) => (
              <div key={item._id} className="receipt-item-row">
                <div>
                  <div className="receipt-item-name">{item.name}</div>
                  <div className="receipt-item-qty">Quantity: {item.quantity}</div>
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
              <span className="total-label">Total Amount Paid</span>
              <span className="total-val">${order.totalAmount?.toFixed(2)}</span>
            </div>
          </div>

          {payment && (
            <div className="payment-meta-box">
              <span>
                Mock Payment Ref: <code>{payment.paymentId}</code>
              </span>
            </div>
          )}
        </div>

        {/* Shipping Destination & Next Steps */}
        <div className="receipt-side-column">
          <div className="receipt-side-card">
            <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Delivery Destination</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              {order.shippingAddress?.street || 'Standard Delivery'}<br />
              {order.shippingAddress?.city && `${order.shippingAddress.city}, `}
              {order.shippingAddress?.state} {order.shippingAddress?.postalCode}<br />
              {order.shippingAddress?.country || 'USA'}
            </p>
          </div>

          <div className="receipt-side-card">
            <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Next Actions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link to="/orders" className="btn btn-primary" id="btn-confirmation-view-orders">
                View in Order History
              </Link>
              <Link to="/products" className="btn btn-secondary">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
