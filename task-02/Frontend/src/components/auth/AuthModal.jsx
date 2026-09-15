import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalTab,
    setAuthModalTab,
    login,
    register,
  } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (authModalTab === 'login') {
        await login(email, password);
      } else {
        if (!name.trim()) {
          setError('Name is required');
          setSubmitting(false);
          return;
        }
        await register(name, email, password);
      }
      // Reset form
      setName('');
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={closeAuthModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button
          className="modal-close-btn"
          onClick={closeAuthModal}
          aria-label="Close modal"
        >
          &times;
        </button>

        <div className="modal-tabs">
          <button
            className={`modal-tab ${authModalTab === 'login' ? 'active' : ''}`}
            onClick={() => {
              setAuthModalTab('login');
              setError('');
            }}
          >
            Sign In
          </button>
          <button
            className={`modal-tab ${authModalTab === 'register' ? 'active' : ''}`}
            onClick={() => {
              setAuthModalTab('register');
              setError('');
            }}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="modal-error">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          {authModalTab === 'register' && (
            <div className="form-group">
              <label className="form-label" htmlFor="auth-name">
                Full Name
              </label>
              <input
                id="auth-name"
                type="text"
                className="form-input"
                placeholder="Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="auth-email">
              Email Address
            </label>
            <input
              id="auth-email"
              type="email"
              className="form-input"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="auth-password">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              className="form-input"
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={submitting}
          >
            {submitting
              ? 'Processing...'
              : authModalTab === 'login'
                ? 'Sign In'
                : 'Create Account'}
          </button>
        </form>

        <div className="modal-footer-note">
          {authModalTab === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                className="text-link"
                onClick={() => {
                  setAuthModalTab('register');
                  setError('');
                }}
              >
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already registered?{' '}
              <button
                type="button"
                className="text-link"
                onClick={() => {
                  setAuthModalTab('login');
                  setError('');
                }}
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
