import { cartService } from "../services/cart.service.js";

// Fetch the logged-in user's cart
export const getCart = async (req, res) => {
    try {
        const cart = await cartService.getCartByUserId(req.user._id);
        res.status(200).json({
            success: true,
            cart,
        });
    } catch (error) {
        console.error("Error fetching cart:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Server error fetching cart",
        });
    }
};

// Add product to cart (default 1 unit if not specified)
export const addItemToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: "Product ID is required",
            });
        }

        const cart = await cartService.addItemToCart(
            req.user._id,
            productId,
            quantity || 1
        );

        res.status(200).json({
            success: true,
            message: "Item added to cart",
            cart,
        });
    } catch (error) {
        console.error("Error adding item to cart:", error);
        res.status(400).json({
            success: false,
            message: error.message || "Failed to add item to cart",
        });
    }
};

// Update item count after user changes quantity
export const updateCartItemQuantity = async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;

        if (quantity === undefined) {
            return res.status(400).json({
                success: false,
                message: "Quantity is required",
            });
        }

        const cart = await cartService.updateItemQuantity(
            req.user._id,
            productId,
            quantity
        );

        res.status(200).json({
            success: true,
            message: "Cart updated",
            cart,
        });
    } catch (error) {
        console.error("Error updating cart quantity:", error);
        res.status(400).json({
            success: false,
            message: error.message || "Failed to update cart",
        });
    }
};

// Remove a single product from cart
export const removeCartItem = async (req, res) => {
    try {
        const { productId } = req.params;
        const cart = await cartService.removeItem(req.user._id, productId);

        res.status(200).json({
            success: true,
            message: "Item removed from cart",
            cart,
        });
    } catch (error) {
        console.error("Error removing cart item:", error);
        res.status(400).json({
            success: false,
            message: error.message || "Failed to remove item",
        });
    }
};

// Empty all items from user's cart
export const clearCart = async (req, res) => {
    try {
        const cart = await cartService.clearCart(req.user._id);

        res.status(200).json({
            success: true,
            message: "Cart cleared successfully",
            cart,
        });
    } catch (error) {
        console.error("Error clearing cart:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to clear cart",
        });
    }
};
