import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="page-placeholder">
      <h1 style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>404 - Page Not Found</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        The page you are looking for does not exist or has moved.
      </p>
      <Link to="/" className="btn btn-primary">
        Back to Store
      </Link>
    </div>
  );
}
