import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export default function Navbar() {
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const { itemCount } = useCart();

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/products" className="brand-link" id="nav-brand">
          TechStore
        </Link>

        <nav className="nav-links" aria-label="Main Navigation">
          <NavLink
            to="/products"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            id="nav-link-products"
          >
            Products
          </NavLink>

          <NavLink
            to="/cart"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            id="nav-link-cart"
          >
            Cart {itemCount > 0 && `(${itemCount})`}
          </NavLink>

          {isAuthenticated && (
            <NavLink
              to="/orders"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              id="nav-link-orders"
            >
              My Orders
            </NavLink>
          )}
        </nav>

        <div className="nav-actions">
          {isAuthenticated ? (
            <div className="user-profile-menu">
              <span className="user-greeting" title={user?.email}>
                {user?.name?.split(' ')[0]}
              </span>
              <button
                onClick={logout}
                className="btn btn-secondary btn-sm"
                title="Sign Out"
                id="btn-logout"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="btn btn-secondary btn-sm"
              id="btn-open-login"
            >
              Sign In
            </button>
          )}

          <Link to="/cart" className="btn btn-secondary btn-sm" title="View Cart" id="nav-cart-button">
            Cart ({itemCount})
          </Link>
        </div>
      </div>
    </header>
  );
}
