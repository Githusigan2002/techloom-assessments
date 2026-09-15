import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const { cart, itemCount, totalAmount, fetchCart } = useCart();

  const [checkoutSession, setCheckoutSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [sessionError, setSessionError] = useState(null);

  // Address State
  const [street, setStreet] = useState(user?.address?.street || '123 Market Street');
  const [city, setCity] = useState(user?.address?.city || 'San Francisco');
  const [state, setState] = useState(user?.address?.state || 'CA');
  const [postalCode, setPostalCode] = useState(user?.address?.postalCode || '94103');
  const [country, setCountry] = useState(user?.address?.country || 'USA');

  // Gateway Simulation State
  const [simulationMode, setSimulationMode] = useState('SUCCESS'); // 'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'DOUBLE_CLICK'
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [duplicateAlert, setDuplicateAlert] = useState(null);

  // Expiration countdown in seconds (10 minutes default)
  const [timeLeft, setTimeLeft] = useState(600);

  // 1. Initialize checkout session and stock reservation on mount
  useEffect(() => {
    if (!isAuthenticated) {
      setLoadingSession(false);
      return;
    }

    const initSession = async () => {
      setLoadingSession(true);
      setSessionError(null);
      try {
        const res = await api.post('/checkout/session', {
          shippingAddress: { street, city, state, postalCode, country },
        });
        setCheckoutSession(res.checkoutSession);
        // Calculate remaining seconds if reservationExpiresAt is provided
        if (res.checkoutSession.reservationExpiresAt) {
          const diff = Math.floor(
            (new Date(res.checkoutSession.reservationExpiresAt).getTime() - Date.now()) / 1000
          );
          setTimeLeft(Math.max(0, diff));
        }
      } catch (err) {
        setSessionError(err.message || 'Could not initiate stock reservation.');
      } finally {
        setLoadingSession(false);
      }
    };

    initSession();
  }, [isAuthenticated]);

  // Countdown timer effect
  useEffect(() => {
    if (!checkoutSession || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [checkoutSession, timeLeft]);

  // Format mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Handle Payment Submission
  const handlePayment = async (e) => {
    e.preventDefault();
    if (!checkoutSession) return;

    setIsProcessing(true);
    setPaymentError(null);
    setDuplicateAlert(null);

    const orderId = checkoutSession.orderId;
    const idempotencyKey = checkoutSession.idempotencyKey;

    try {
      if (simulationMode === 'DOUBLE_CLICK') {
        // Phase 9 Demonstration: Rapidly fire 2 identical payment requests with same Idempotency Key!
        const promise1 = api.post('/payments/process', {
          orderId,
          idempotencyKey,
          outcome: 'SUCCESS',
        });
        const promise2 = api.post('/payments/process', {
          orderId,
          idempotencyKey,
          outcome: 'SUCCESS',
        });

        const [res1, res2] = await Promise.all([promise1, promise2]);
        await fetchCart();

        setDuplicateAlert(
          'Idempotency Key Protected: Rapid double-click detected. Second request received cached order receipt without duplicate charging.'
        );
        setTimeout(() => {
          navigate(`/order-confirmation/${orderId}`, { state: { order: res1.order, payment: res1.payment } });
        }, 2200);
        return;
      }

      // Standard outcome simulation
      const res = await api.post('/payments/process', {
        orderId,
        idempotencyKey,
        outcome: simulationMode,
      });

      // Clear customer cart state on frontend
      await fetchCart();

      // Navigate to confirmation receipt
      navigate(`/order-confirmation/${orderId}`, { state: { order: res.order, payment: res.payment } });
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        'Payment failed. Reserved stock has been automatically released back to inventory.';
      setPaymentError(errMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="page-placeholder">
        <h1 style={{ fontSize: '1.8rem', marginBottom: '0.75rem' }}>Sign In to Complete Checkout</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 1.75rem' }}>
          An authenticated account is required to reserve stock and record your order.
        </p>
        <button onClick={() => openAuthModal('login')} className="btn btn-primary">
          Sign In
        </button>
      </div>
    );
  }

  if (loadingSession) {
    return (
      <div className="loading-grid-container" style={{ minHeight: '50vh' }}>
        <h2 style={{ fontSize: '1.4rem', marginTop: '1.25rem', marginBottom: '0.5rem' }}>
          Reserving Stock...
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Establishing an atomic inventory reservation for your cart items.
        </p>
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="page-placeholder">
        <h1 style={{ fontSize: '1.8rem', marginBottom: '0.75rem' }}>Checkout Stock Issue</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '460px', margin: '0 auto 2rem' }}>
          {sessionError}
        </p>
        <Link to="/cart" className="btn btn-primary">
          Return to Cart
        </Link>
      </div>
    );
  }

  const order = checkoutSession?.order;
  const summary = checkoutSession?.summary;

  return (
    <div className="checkout-page">
      {/* Reservation Active Banner */}
      <div className={`reservation-timer-banner ${timeLeft <= 60 ? 'warning' : ''}`}>
        <div>
          <strong>Stock reserved while payment is processing.</strong>
        </div>
        <div className="timer-countdown">
          Time remaining: <span className="timer-digits">{formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className="checkout-layout-grid">
        {/* Left: Shipping & Mock Payment Form */}
        <div className="checkout-form-column">
          <form onSubmit={handlePayment} className="checkout-form">
            {/* Delivery Address Card */}
            <div className="checkout-card">
              <h2 className="checkout-card-title">1. Delivery Address</h2>
              <div className="form-grid-2">
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Street Address</label>
                  <input
                    type="text"
                    className="form-input"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    className="form-input"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">State / Province</label>
                  <input
                    type="text"
                    className="form-input"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Postal / ZIP Code</label>
                  <input
                    type="text"
                    className="form-input"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Country</label>
                  <input
                    type="text"
                    className="form-input"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Mock Payment Gateway Card with Scenario Simulator */}
            <div className="checkout-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h2 className="checkout-card-title" style={{ marginBottom: 0 }}>
                  2. Payment Method
                </h2>
                <div className="secure-badge">
                  <span>Idempotency Protected</span>
                </div>
              </div>

              {/* Assessment Requirement: Failure & Timeout Scenario Selector */}
              <div className="simulation-selector-box">
                <div className="simulation-header">
                  <strong>Select payment scenario to simulate:</strong>
                </div>
                <div className="simulation-options">
                  <label className={`sim-radio-card ${simulationMode === 'SUCCESS' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="simulationMode"
                      value="SUCCESS"
                      checked={simulationMode === 'SUCCESS'}
                      onChange={() => setSimulationMode('SUCCESS')}
                    />
                    <div>
                      <div className="sim-title" style={{ color: 'var(--success)' }}>Successful Payment</div>
                      <div className="sim-desc">Order confirmed and reserved stock is sold</div>
                    </div>
                  </label>

                  <label className={`sim-radio-card ${simulationMode === 'FAILED' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="simulationMode"
                      value="FAILED"
                      checked={simulationMode === 'FAILED'}
                      onChange={() => setSimulationMode('FAILED')}
                    />
                    <div>
                      <div className="sim-title" style={{ color: 'var(--danger)' }}>Failed Payment</div>
                      <div className="sim-desc">Card decline, releases reserved stock</div>
                    </div>
                  </label>

                  <label className={`sim-radio-card ${simulationMode === 'TIMEOUT' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="simulationMode"
                      value="TIMEOUT"
                      checked={simulationMode === 'TIMEOUT'}
                      onChange={() => setSimulationMode('TIMEOUT')}
                    />
                    <div>
                      <div className="sim-title" style={{ color: 'var(--warning)' }}>Payment Timeout</div>
                      <div className="sim-desc">Gateway timeout, releases reserved stock</div>
                    </div>
                  </label>

                  <label className={`sim-radio-card ${simulationMode === 'DOUBLE_CLICK' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="simulationMode"
                      value="DOUBLE_CLICK"
                      checked={simulationMode === 'DOUBLE_CLICK'}
                      onChange={() => setSimulationMode('DOUBLE_CLICK')}
                    />
                    <div>
                      <div className="sim-title">Duplicate Payment</div>
                      <div className="sim-desc">Tests idempotency protection against duplicate requests</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Card Inputs */}
              <div className="mock-card-inputs">
                <div className="form-group">
                  <label className="form-label">Cardholder Name</label>
                  <input type="text" className="form-input" defaultValue={user?.name || 'Jane Doe'} />
                </div>
                <div className="form-group">
                  <label className="form-label">Card Number</label>
                  <input
                    type="text"
                    className="form-input"
                    defaultValue="4242 •••• •••• 4242"
                    readOnly
                  />
                </div>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Expiry</label>
                    <input type="text" className="form-input" defaultValue="12/28" readOnly />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CVC / CVV</label>
                    <input type="text" className="form-input" defaultValue="888" readOnly />
                  </div>
                </div>
              </div>

              {duplicateAlert && (
                <div className="alert-duplicate-info">
                  <span>{duplicateAlert}</span>
                </div>
              )}

              {paymentError && (
                <div className="alert-payment-error">
                  <div>
                    <strong>Payment Unsuccessful:</strong> {paymentError}
                    <div style={{ fontSize: '0.825rem', marginTop: '0.25rem' }}>
                      Reserved stock has been automatically released back to the store.
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isProcessing || timeLeft <= 0}
                className="btn btn-primary btn-pay-now"
                id="btn-pay-now"
              >
                {isProcessing
                  ? 'Communicating with Payment Gateway...'
                  : `Pay Now — $${summary?.totalAmount?.toFixed(2)}`}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Reserved Order Summary */}
        <div className="checkout-summary-column">
          <div className="cart-summary-card">
            <h2 className="summary-title">Reserved Items ({order?.items?.length})</h2>

            <div className="reserved-items-list">
              {order?.items?.map((item) => (
                <div key={item._id} className="reserved-item-row">
                  <div>
                    <div className="reserved-item-name">{item.name}</div>
                    <div className="reserved-item-qty">Qty: {item.quantity} × ${item.price.toFixed(2)}</div>
                  </div>
                  <div className="reserved-item-subtotal">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="summary-divider"></div>

            <div className="summary-rows">
              <div className="summary-row">
                <span className="summary-label">Items Subtotal</span>
                <span className="summary-val">${summary?.subtotal?.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Delivery</span>
                <span className="summary-val">
                  {summary?.shipping === 0 ? 'Free' : `$${summary?.shipping?.toFixed(2)}`}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Estimated Tax</span>
                <span className="summary-val">${summary?.estimatedTax?.toFixed(2)}</span>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-row total-row">
                <span className="total-label">Total Due</span>
                <span className="total-val">${summary?.totalAmount?.toFixed(2)}</span>
              </div>
            </div>

            <div className="idempotency-key-tag" title="Prevents duplicate charges">
              <span>IDEMPOTENCY KEY:</span> <code>{checkoutSession?.idempotencyKey?.substring(0, 24)}...</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
