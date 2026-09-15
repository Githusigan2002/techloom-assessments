const { Cart, Product } = require('../models');
const { AppError } = require('../middleware/errorHandler');

// Helper to locate or instantiate a cart for user or guest session
const getOrCreateCart = async (req) => {
  const userId = req.user ? req.user._id : null;
  const sessionId = req.headers['x-session-id'] || null;

  let query = null;
  if (userId) {
    query = { user: userId };
  } else if (sessionId) {
    query = { sessionId: sessionId };
  } else {
    // Generate a temporary session id if neither provided
    const tempSessionId = 'guest_' + Math.random().toString(36).substring(2, 15);
    const cart = await Cart.create({ sessionId: tempSessionId, items: [] });
    return { cart, sessionId: tempSessionId };
  }

  let cart = await Cart.findOne(query).populate('items.product');

  if (!cart) {
    cart = await Cart.create({
      user: userId,
      sessionId: userId ? null : sessionId,
      items: [],
    });
  }

  return { cart, sessionId };
};

// View Cart
const getCart = async (req, res, next) => {
  try {
    const { cart } = await getOrCreateCart(req);

    // Filter out items whose product might have been deleted
    cart.items = cart.items.filter((item) => item.product !== null);

    res.status(200).json({
      status: 'success',
      cart: {
        _id: cart._id,
        items: cart.items,
        itemCount: cart.itemCount,
        totalAmount: cart.totalAmount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Add to Cart
// IMPORTANT: Does NOT permanently reduce stock. Stock reservation occurs during checkout!
const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const qty = parseInt(quantity, 10) || 1;

    if (!productId) {
      return next(new AppError('Product ID is required', 400));
    }
    if (qty <= 0) {
      return next(new AppError('Quantity must be greater than zero', 400));
    }

    const product = await Product.findById(productId);
    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    // Verify requested quantity does not exceed currently available stock
    const available = product.availableStock;
    if (available < qty) {
      return next(
        new AppError(
          `Cannot add ${qty} items. Only ${available} units are currently available.`,
          400
        )
      );
    }

    const { cart, sessionId } = await getOrCreateCart(req);

    const existingItemIndex = cart.items.findIndex(
      (item) => item.product && item.product._id.toString() === productId
    );

    if (existingItemIndex > -1) {
      const newTotalQuantity = cart.items[existingItemIndex].quantity + qty;
      if (newTotalQuantity > available) {
        return next(
          new AppError(
            `Cart total (${newTotalQuantity}) exceeds available stock (${available})`,
            400
          )
        );
      }
      cart.items[existingItemIndex].quantity = newTotalQuantity;
      cart.items[existingItemIndex].price = product.price;
    } else {
      cart.items.push({
        product: product._id,
        quantity: qty,
        price: product.price,
      });
    }

    await cart.save();
    const populatedCart = await Cart.findById(cart._id).populate('items.product');

    res.status(200).json({
      status: 'success',
      message: 'Item added to cart successfully',
      sessionId: sessionId || undefined,
      cart: {
        _id: populatedCart._id,
        items: populatedCart.items,
        itemCount: populatedCart.itemCount,
        totalAmount: populatedCart.totalAmount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update Cart Item Quantity
const updateCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const qty = parseInt(quantity, 10);

    if (qty <= 0) {
      return next(new AppError('Quantity must be greater than 0. Use remove to delete item.', 400));
    }

    const { cart } = await getOrCreateCart(req);

    const item = cart.items.id(itemId);
    if (!item) {
      return next(new AppError('Cart item not found', 404));
    }

    const product = await Product.findById(item.product._id || item.product);
    if (!product) {
      return next(new AppError('Product no longer available', 404));
    }

    if (qty > product.availableStock) {
      return next(
        new AppError(
          `Requested quantity (${qty}) exceeds available stock (${product.availableStock})`,
          400
        )
      );
    }

    item.quantity = qty;
    item.price = product.price;

    await cart.save();
    const populatedCart = await Cart.findById(cart._id).populate('items.product');

    res.status(200).json({
      status: 'success',
      cart: {
        _id: populatedCart._id,
        items: populatedCart.items,
        itemCount: populatedCart.itemCount,
        totalAmount: populatedCart.totalAmount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Remove Item from Cart
const removeCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { cart } = await getOrCreateCart(req);

    cart.items = cart.items.filter((item) => item._id.toString() !== itemId);

    await cart.save();
    const populatedCart = await Cart.findById(cart._id).populate('items.product');

    res.status(200).json({
      status: 'success',
      message: 'Item removed from cart',
      cart: {
        _id: populatedCart._id,
        items: populatedCart.items,
        itemCount: populatedCart.itemCount,
        totalAmount: populatedCart.totalAmount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Clear Cart
const clearCart = async (req, res, next) => {
  try {
    const { cart } = await getOrCreateCart(req);

    cart.items = [];
    await cart.save();

    res.status(200).json({
      status: 'success',
      message: 'Cart cleared successfully',
      cart: {
        _id: cart._id,
        items: [],
        itemCount: 0,
        totalAmount: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};
