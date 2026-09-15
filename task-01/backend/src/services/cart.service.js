import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";

// Service layer for shopping cart operations
export const cartService = {
    // Get or initialize cart for a user
    async getCartByUserId(userId) {
        let cart = await Cart.findOne({ user: userId }).populate("items.product", "name sku price stock reservedStock availableStock");
        if (!cart) {
            cart = await Cart.create({ user: userId, items: [], totalAmount: 0 });
        }
        return cart;
    },

    // Add a product to the user's cart
    async addItemToCart(userId, productId, quantity = 1) {
        const qty = Number(quantity);

        // Validation: Quantity must be greater than 0
        if (isNaN(qty) || qty <= 0) {
            throw new Error("Quantity must be a positive number");
        }

        // Check if product exists in database
        const product = await Product.findById(productId);
        if (!product) {
            throw new Error("Product not found");
        }

        // Check product's current available stock
        const availableStock = product.availableStock !== undefined ? product.availableStock : (product.stock - product.reservedStock);

        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = new Cart({ user: userId, items: [] });
        }

        // Check if item already exists in cart
        const existingItemIndex = cart.items.findIndex(
            (item) => item.product.toString() === productId.toString()
        );

        const currentQtyInCart = existingItemIndex > -1 ? cart.items[existingItemIndex].quantity : 0;
        const totalDesiredQty = currentQtyInCart + qty;

        // Validation: Cannot add more than available stock
        if (totalDesiredQty > availableStock) {
            throw new Error(
                `Cannot add ${qty} item(s). Only ${availableStock} available in stock (${currentQtyInCart} already in cart).`
            );
        }

        if (existingItemIndex > -1) {
            // Update quantity of existing item
            cart.items[existingItemIndex].quantity = totalDesiredQty;
            cart.items[existingItemIndex].price = product.price; // Update to latest price
        } else {
            // Add new item to cart
            cart.items.push({
                product: product._id,
                name: product.name,
                price: product.price,
                quantity: qty,
            });
        }

        // Recalculate total
        cart.calculateTotal();
        await cart.save();

        return cart;
    },

    // Update quantity of a specific item in the cart
    async updateItemQuantity(userId, productId, quantity) {
        const qty = Number(quantity);

        if (isNaN(qty) || qty < 0) {
            throw new Error("Quantity must be 0 or a positive number");
        }

        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            throw new Error("Cart not found");
        }

        const itemIndex = cart.items.findIndex(
            (item) => item.product.toString() === productId.toString()
        );

        if (itemIndex === -1) {
            throw new Error("Product is not in your cart");
        }

        // If quantity is set to 0, remove item from cart
        if (qty === 0) {
            cart.items.splice(itemIndex, 1);
        } else {
            // Check available stock before updating
            const product = await Product.findById(productId);
            if (!product) {
                throw new Error("Product not found");
            }

            const availableStock = product.availableStock !== undefined ? product.availableStock : (product.stock - product.reservedStock);
            if (qty > availableStock) {
                throw new Error(`Cannot set quantity to ${qty}. Only ${availableStock} available in stock.`);
            }

            cart.items[itemIndex].quantity = qty;
            cart.items[itemIndex].price = product.price;
        }

        cart.calculateTotal();
        await cart.save();

        return cart;
    },

    // Remove a single item from the cart
    async removeItem(userId, productId) {
        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            throw new Error("Cart not found");
        }

        cart.items = cart.items.filter(
            (item) => item.product.toString() !== productId.toString()
        );

        cart.calculateTotal();
        await cart.save();

        return cart;
    },

    // Clear all items from the cart
    async clearCart(userId) {
        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = new Cart({ user: userId, items: [] });
        } else {
            cart.items = [];
            cart.totalAmount = 0;
        }
        await cart.save();
        return cart;
    },
};
