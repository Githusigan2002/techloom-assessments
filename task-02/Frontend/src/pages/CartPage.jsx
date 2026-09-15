import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function CartPage() {
  const navigate = useNavigate();
  const {
    items,
    itemCount,
    totalAmount,
    loading,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const { isAuthenticated, openAuthModal } = useAuth();

  const handleUpdateQty = (item, newQty) => {
    if (newQty <= 0) {
      removeFromCart(item._id);
    } else {
      updateQuantity(item._id, newQty);
    }
  };

  if (loading) {
    return (
      <div className="page-placeholder">
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Loading Your Cart...</h2>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="page-placeholder" id="empty-cart-view">
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Your Cart is Empty</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 1.5rem' }}>
          Browse our products and add items to your cart.
        </p>
        <Link to="/products" className="btn btn-primary" id="btn-empty-cart-shop">
          Browse Products
        </Link>
      </div>
    );
  }

  const shipping = totalAmount >= 100 ? 0 : 9.99;
  const estimatedTax = totalAmount * 0.08;
  const grandTotal = totalAmount + shipping + estimatedTax;

  return (
    <div className="cart-page">
      <div className="cart-page-header">
        <div>
          <h1 className="cart-title">Shopping Cart</h1>
          <p className="cart-subtitle">
            Review your items before proceeding to checkout.
          </p>
        </div>

        <button
          onClick={clearCart}
          className="btn-clear-cart"
          title="Clear all items from cart"
          id="btn-clear-cart"
        >
          Clear Cart
        </button>
      </div>

      <div className="cart-layout-grid">
        {/* Cart Items List */}
        <div className="cart-items-column">
          {items.map((item) => {
            const product = item.product || {};
            const availableStock = product.availableStock !== undefined ? product.availableStock : product.stock;

            return (
              <div key={item._id} className="cart-item-card" id={`cart-item-${item._id}`}>
                {/* Product Image */}
                <Link to={`/products/${product._id}`} className="cart-item-thumb">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="cart-thumb-img"
                  />
                </Link>

                {/* Info & Title */}
                <div className="cart-item-details">
                  <span className="cart-item-category">{product.category}</span>
                  <Link to={`/products/${product._id}`} className="cart-item-name">
                    {product.name}
                  </Link>
                  <div className="cart-item-unit-price">
                    ${(item.price || product.price || 0).toFixed(2)} each
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="cart-item-quantity-wrapper">
                  <div className="quantity-stepper stepper-sm">
                    <button
                      type="button"
                      className="stepper-btn"
                      onClick={() => handleUpdateQty(item, item.quantity - 1)}
                      title="Decrease quantity"
                      id={`btn-decrease-qty-${item._id}`}
                    >
                      -
                    </button>
                    <span className="stepper-value" id={`cart-qty-${item._id}`}>
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="stepper-btn"
                      onClick={() => handleUpdateQty(item, item.quantity + 1)}
                      disabled={item.quantity >= availableStock}
                      title={
                        item.quantity >= availableStock
                          ? 'Reached maximum available stock'
                          : 'Increase quantity'
                      }
                      id={`btn-increase-qty-${item._id}`}
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item._id)}
                    className="btn-remove-item"
                    title="Remove item"
                    id={`btn-remove-${item._id}`}
                  >
                    Remove
                  </button>
                </div>

                {/* Subtotal */}
                <div className="cart-item-subtotal">
                  ${((item.price || product.price || 0) * item.quantity).toFixed(2)}
                </div>
              </div>
            );
          })}

          {/* Policy Notice */}
          <div className="cart-policy-notice">
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Stock is reserved only when you proceed to checkout.
            </p>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="cart-summary-column">
          <div className="cart-summary-card">
            <h2 className="summary-title">Order Summary</h2>

            <div className="summary-rows">
              <div className="summary-row">
                <span className="summary-label">Items Subtotal ({itemCount})</span>
                <span className="summary-val">${totalAmount.toFixed(2)}</span>
              </div>

              <div className="summary-row">
                <span className="summary-label">Standard Delivery</span>
                <span className="summary-val">
                  {shipping === 0 ? (
                    <span style={{ color: 'var(--success)' }}>Free</span>
                  ) : (
                    `$${shipping.toFixed(2)}`
                  )}
                </span>
              </div>

              <div className="summary-row">
                <span className="summary-label">Estimated Tax (8%)</span>
                <span className="summary-val">${estimatedTax.toFixed(2)}</span>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-row total-row">
                <span className="total-label">Total Amount</span>
                <span className="total-val" id="cart-grand-total">
                  ${grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Checkout Action Button */}
            {isAuthenticated ? (
              <button
                className="btn btn-primary btn-checkout"
                id="btn-proceed-checkout"
                onClick={() => navigate('/checkout')}
              >
                Proceed to Checkout
              </button>
            ) : (
              <div>
                <button
                  className="btn btn-primary btn-checkout"
                  id="btn-checkout-login-prompt"
                  onClick={() => openAuthModal('login')}
                >
                  Sign In to Checkout
                </button>
                <p className="checkout-guest-note">
                  Sign in or create an account to place your order.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
