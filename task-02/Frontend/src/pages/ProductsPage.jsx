import React, { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { useCart } from '../context/CartContext';

export default function ProductsPage() {
  const { addToCart } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);

  // Filter states initialized from URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get('category') || 'all'
  );
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [inStockOnly, setInStockOnly] = useState(
    searchParams.get('available') === 'true'
  );
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get('page'), 10) || 1
  );

  // Fetch unique categories once
  useEffect(() => {
    api
      .get('/products/categories')
      .then((res) => {
        setCategories(res.categories || []);
      })
      .catch(() => {});
  }, []);

  // Fetch products function
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (selectedCategory && selectedCategory !== 'all')
        params.set('category', selectedCategory);
      if (minPrice !== '') params.set('minPrice', minPrice);
      if (maxPrice !== '') params.set('maxPrice', maxPrice);
      if (inStockOnly) params.set('available', 'true');
      if (sortBy) params.set('sort', sortBy);
      params.set('page', currentPage.toString());
      params.set('limit', '8');

      const data = await api.get(`/products?${params.toString()}`);
      setProducts(data.products || []);
      setPagination({
        currentPage: data.currentPage || 1,
        totalPages: data.totalPages || 1,
        totalProducts: data.totalProducts || 0,
        hasNextPage: data.hasNextPage || false,
        hasPrevPage: data.hasPrevPage || false,
      });
    } catch (err) {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [
    searchQuery,
    selectedCategory,
    minPrice,
    maxPrice,
    inStockOnly,
    sortBy,
    currentPage,
  ]);

  // Sync state to URL and fetch
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (selectedCategory && selectedCategory !== 'all')
      params.set('category', selectedCategory);
    if (minPrice !== '') params.set('minPrice', minPrice);
    if (maxPrice !== '') params.set('maxPrice', maxPrice);
    if (inStockOnly) params.set('available', 'true');
    if (sortBy && sortBy !== 'newest') params.set('sort', sortBy);
    if (currentPage > 1) params.set('page', currentPage.toString());

    setSearchParams(params, { replace: true });
    fetchProducts();
  }, [
    searchQuery,
    selectedCategory,
    minPrice,
    maxPrice,
    inStockOnly,
    sortBy,
    currentPage,
    fetchProducts,
    setSearchParams,
  ]);

  // Handle Add To Cart
  const handleAddToCart = async (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.availableStock <= 0) return;

    setAddingId(product._id);
    await addToCart(product._id, 1);
    setAddingId(null);
  };

  // Reset filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setMinPrice('');
    setMaxPrice('');
    setInStockOnly(false);
    setSortBy('newest');
    setCurrentPage(1);
  };

  return (
    <div className="products-page">
      {/* Page Header */}
      <div className="products-header">
        <div>
          <h1 className="products-title">Products</h1>
          <p className="products-subtitle">
            Browse products and place your order.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="search-filter-section">
        <div className="search-box">
          <input
            type="text"
            className="search-input"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            id="product-search-input"
          />
          {searchQuery && (
            <button
              className="search-clear-btn"
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="category-pills" role="tablist" aria-label="Product Categories">
          <button
            className={`pill-btn ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => {
              setSelectedCategory('all');
              setCurrentPage(1);
            }}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`pill-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory(cat);
                setCurrentPage(1);
              }}
            >
              <span style={{ textTransform: 'capitalize' }}>{cat}</span>
            </button>
          ))}
        </div>

        {/* Advanced Filters Row: Price, Stock, Sort */}
        <div className="secondary-filters-bar">
          <div className="price-inputs-group">
            <span className="filter-label">Price Range:</span>
            <input
              type="number"
              className="price-input"
              placeholder="Min $"
              min="0"
              value={minPrice}
              onChange={(e) => {
                setMinPrice(e.target.value);
                setCurrentPage(1);
              }}
              id="filter-min-price"
            />
            <span className="price-separator">—</span>
            <input
              type="number"
              className="price-input"
              placeholder="Max $"
              min="0"
              value={maxPrice}
              onChange={(e) => {
                setMaxPrice(e.target.value);
                setCurrentPage(1);
              }}
              id="filter-max-price"
            />
          </div>

          <label className="checkbox-filter-label" htmlFor="stock-filter-checkbox">
            <input
              type="checkbox"
              id="stock-filter-checkbox"
              checked={inStockOnly}
              onChange={(e) => {
                setInStockOnly(e.target.checked);
                setCurrentPage(1);
              }}
            />
            <span>In Stock Only</span>
          </label>

          <div className="sort-dropdown-group">
            <span className="filter-label">Sort:</span>
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              id="product-sort-select"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name (A–Z)</option>
            </select>
          </div>

          {(searchQuery ||
            selectedCategory !== 'all' ||
            minPrice !== '' ||
            maxPrice !== '' ||
            inStockOnly ||
            sortBy !== 'newest') && (
            <button
              onClick={handleClearFilters}
              className="btn-clear-filters"
              title="Reset all filters"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div className="results-info-bar">
        <span>
          Showing <strong>{products.length}</strong> of{' '}
          <strong>{pagination.totalProducts || 0}</strong> products
        </span>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="loading-grid-container">
          <p style={{ color: 'var(--text-secondary)' }}>
            Loading products...
          </p>
        </div>
      ) : products.length === 0 ? (
        <div className="empty-results-card">
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>No Products Found</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', marginBottom: '1.5rem' }}>
            We couldn't find any products matching your active filters. Try adjusting your search query or price range.
          </p>
          <button onClick={handleClearFilters} className="btn btn-secondary">
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="product-grid" id="product-grid-container">
          {products.map((product) => {
            const isAvailable = product.availableStock > 0;
            const isAdding = addingId === product._id;

            return (
              <div key={product._id} className="product-card" id={`product-${product._id}`}>
                {/* Product Image */}
                <Link to={`/products/${product._id}`} className="product-image-wrap">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="product-image"
                    loading="lazy"
                  />
                  <span className="product-category-tag">{product.category}</span>
                </Link>

                {/* Product Details */}
                <div className="product-card-body">
                  <div className="product-card-header">
                    <Link to={`/products/${product._id}`} className="product-card-title">
                      {product.name}
                    </Link>
                  </div>

                  <p className="product-card-desc">
                    {product.description.length > 95
                      ? `${product.description.substring(0, 95)}...`
                      : product.description}
                  </p>

                  <div className="product-stock-status">
                    {isAvailable ? (
                      <span className="badge-stock in-stock">
                        <span>In Stock ({product.availableStock} left)</span>
                      </span>
                    ) : (
                      <span className="badge-stock out-of-stock">
                        <span>Out of Stock</span>
                      </span>
                    )}
                  </div>

                  {/* Card Bottom: Price and Add To Cart */}
                  <div className="product-card-footer">
                    <div className="product-price">
                      ${product.price.toFixed(2)}
                    </div>

                    <div className="product-card-actions">
                      <Link
                        to={`/products/${product._id}`}
                        className="btn btn-secondary btn-sm"
                        title="View details"
                      >
                        View
                      </Link>

                      <button
                        onClick={(e) => handleAddToCart(product, e)}
                        disabled={!isAvailable || isAdding}
                        className={`btn-add-cart ${!isAvailable ? 'disabled' : ''}`}
                        title={isAvailable ? 'Add to Cart' : 'Out of Stock'}
                        id={`btn-add-cart-${product._id}`}
                      >
                        {isAdding ? 'Adding...' : 'Add'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="pagination-bar" aria-label="Pagination">
          <button
            className="pagination-btn"
            disabled={!pagination.hasPrevPage}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            id="pagination-prev"
          >
            Previous
          </button>

          <div className="pagination-pages">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
              (pageNum) => (
                <button
                  key={pageNum}
                  className={`page-number-btn ${
                    pageNum === pagination.currentPage ? 'active' : ''
                  }`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              )
            )}
          </div>

          <button
            className="pagination-btn"
            disabled={!pagination.hasNextPage}
            onClick={() => setCurrentPage((prev) => prev + 1)}
            id="pagination-next"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
