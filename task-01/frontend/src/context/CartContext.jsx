import React, { createContext, useContext, useState, useEffect } from "react";
import { cartService } from "../services/cartService";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch user's cart from backend
    const fetchCart = async () => {
        if (!isAuthenticated) {
            setCart(null);
            return;
        }

        try {
            setLoading(true);
            const data = await cartService.getCart();
            setCart(data.cart);
        } catch (error) {
            console.error("Failed to load cart:", error);
        } finally {
            setLoading(false);
        }
    };

    // Load cart whenever authentication status changes
    useEffect(() => {
        fetchCart();
    }, [isAuthenticated]);

    // Add item to cart
    const addToCart = async (productId, quantity = 1) => {
        const data = await cartService.addToCart(productId, quantity);
        setCart(data.cart);
        return data;
    };

    // Update quantity of an item in cart
    const updateQuantity = async (productId, quantity) => {
        const data = await cartService.updateQuantity(productId, quantity);
        setCart(data.cart);
        return data;
    };

    // Remove single item from cart
    const removeItem = async (productId) => {
        const data = await cartService.removeItem(productId);
        setCart(data.cart);
        return data;
    };

    // Clear entire cart
    const clearCart = async () => {
        const data = await cartService.clearCart();
        setCart(data.cart);
        return data;
    };

    // Calculate total count of items in cart
    const itemCount = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
    const totalAmount = cart?.totalAmount || 0;

    const value = {
        cart,
        itemCount,
        totalAmount,
        loading,
        fetchCart,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
};
