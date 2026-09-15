import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useCart } from '../context/CartContext';

export default function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .get(`/products/${id}`)
      .then((res) => {
        setProduct(res.product);
      })
      .catch((err) => {
        setError(err.message || 'Product not found');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const handleAddToCart = async () => {
    if (!product || product.availableStock <= 0) return;
    setAdding(true);
    setAddedSuccess(false);

    const result = await addToCart(product._id, quantity);
    setAdding(false);

    if (result.success) {
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 3000);
    }
  };

  if (loading) {
    return (
      <div className="loading-grid-container" style={{ minHeight: '50vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>
          Loading product specifications...
        </p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="page-placeholder">
        <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Product Not Found</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          {error || 'The requested product could not be located in our catalog.'}
        </p>
        <Link to="/products" className="btn btn-secondary">
          Back to Products
        </Link>
      </div>
    );
  }

  const isAvailable = product.availableStock > 0;
  const maxAllowed = Math.max(1, product.availableStock);

  return (
    <div className="product-details-page">
      {/* Breadcrumb Navigation */}
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/products" className="breadcrumb-link">
          &larr; All Products
        </Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-category" style={{ textTransform: 'capitalize' }}>
          {product.category}
        </span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{product.name}</span>
      </nav>

      {/* Main Product Showcase Grid */}
      <div className="product-detail-grid">
        {/* Left: Product Image Showcase */}
        <div className="product-showcase-image-wrap">
          <img
            src={product.image}
            alt={product.name}
            className="product-showcase-image"
          />
          <span className="product-showcase-category">{product.category}</span>
        </div>

        {/* Right: Product Meta & Purchase Panel */}
        <div className="product-detail-info">
          <h1 className="product-detail-title">{product.name}</h1>

          <div className="product-detail-pricing">
            <span className="product-detail-price">${product.price.toFixed(2)}</span>
            {isAvailable ? (
              <span className="badge-stock in-stock">
                <span>
                  {product.availableStock <= 3
                    ? `Only ${product.availableStock} available`
                    : `In stock (${product.availableStock} available)`}
                </span>
              </span>
            ) : (
              <span className="badge-stock out-of-stock">
                <span>Out of stock</span>
              </span>
            )}
          </div>

          <p className="product-detail-desc">{product.description}</p>

          {/* Purchase Controls */}
          {isAvailable && (
            <div className="purchase-controls-row">
              <div className="quantity-stepper">
                <button
                  type="button"
                  className="stepper-btn"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="stepper-value">{quantity}</span>
                <button
                  type="button"
                  className="stepper-btn"
                  onClick={() => setQuantity((prev) => Math.min(maxAllowed, prev + 1))}
                  disabled={quantity >= maxAllowed}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={adding}
                className="btn btn-primary"
                style={{ flex: 1 }}
                id="btn-details-add-to-cart"
              >
                {adding
                  ? 'Adding to Cart...'
                  : addedSuccess
                    ? 'Product added to cart!'
                    : `Add to Cart — $${(product.price * quantity).toFixed(2)}`}
              </button>
            </div>
          )}

          {addedSuccess && (
            <div className="added-success-banner">
              <span>Product added to cart.</span>
              <Link to="/cart" className="text-link" style={{ fontWeight: 600 }}>
                View Cart & Checkout &rarr;
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
