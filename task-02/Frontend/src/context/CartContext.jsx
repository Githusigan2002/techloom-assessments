import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type, id: Date.now() });
    setTimeout(() => {
      setNotification((current) => (current?.message === message ? null : current));
    }, 3000);
  };

  const fetchCart = useCallback(async () => {
    try {
      const res = await api.get('/cart');
      setCart(res.cart);
    } catch (err) {
      // Cart fetch fallback
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch cart on mount and whenever user auth state transitions
  useEffect(() => {
    fetchCart();
  }, [fetchCart, user]);

  // Add item to cart (Does NOT reduce stock)
  const addToCart = async (productId, quantity = 1) => {
    try {
      const res = await api.post('/cart', { productId, quantity });
      setCart(res.cart);
      showNotification('Item added to cart!', 'success');
      return { success: true };
    } catch (err) {
      showNotification(err.message || 'Could not add to cart', 'error');
      return { success: false, message: err.message };
    }
  };

  // Update quantity
  const updateQuantity = async (itemId, quantity) => {
    try {
      const res = await api.put(`/cart/${itemId}`, { quantity });
      setCart(res.cart);
      return { success: true };
    } catch (err) {
      showNotification(err.message || 'Could not update quantity', 'error');
      return { success: false, message: err.message };
    }
  };

  // Remove item
  const removeFromCart = async (itemId) => {
    try {
      const res = await api.delete(`/cart/${itemId}`);
      setCart(res.cart);
      showNotification('Item removed from cart', 'info');
      return { success: true };
    } catch (err) {
      showNotification(err.message || 'Could not remove item', 'error');
      return { success: false, message: err.message };
    }
  };

  // Clear cart
  const clearCart = async () => {
    try {
      const res = await api.delete('/cart');
      setCart(res.cart);
      showNotification('Cart cleared', 'info');
      return { success: true };
    } catch (err) {
      showNotification(err.message || 'Could not clear cart', 'error');
      return { success: false, message: err.message };
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount: cart?.itemCount || 0,
        totalAmount: cart?.totalAmount || 0,
        items: cart?.items || [],
        loading,
        notification,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
