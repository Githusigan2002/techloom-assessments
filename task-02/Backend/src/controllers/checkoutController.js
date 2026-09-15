const crypto = require('crypto');
const { Cart, Order } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const inventoryService = require('../services/inventoryService');

// Create checkout session: Atomically reserves stock & establishes pending order
const createCheckoutSession = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { shippingAddress } = req.body;

    // Retrieve active user cart
    const cart = await Cart.findOne({ user: userId }).populate('items.product');

    if (!cart || !cart.items || cart.items.length === 0) {
      return next(new AppError('Your cart is empty. Add products before checking out.', 400));
    }

    // Filter out items whose product may no longer exist
    const validItems = cart.items.filter((item) => item.product !== null);
    if (validItems.length === 0) {
      return next(new AppError('No valid items found in cart.', 400));
    }

    // Phase 6: Atomically check & reserve stock for all cart items
    await inventoryService.reserveStock(validItems);

    // Build order items snapshots
    const orderItems = validItems.map((item) => ({
      product: item.product._id,
      name: item.product.name,
      quantity: item.quantity,
      price: item.price || item.product.price,
    }));

    const subtotal = orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const shipping = subtotal >= 100 ? 0 : 9.99;
    const estimatedTax = subtotal * 0.08;
    const totalAmount = Number((subtotal + shipping + estimatedTax).toFixed(2));

    // Expiration window: 10 minutes from reservation
    const reservationExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const order = await Order.create({
      user: userId,
      items: orderItems,
      totalAmount,
      status: 'pending',
      paymentStatus: 'unpaid',
      reservationStatus: 'reserved',
      reservationExpiresAt,
      shippingAddress: shippingAddress || req.user.address || {},
    });

    // Generate unique idempotency key for this checkout attempt
    const idempotencyKey = `idem_${order._id}_${crypto.randomBytes(8).toString('hex')}`;

    res.status(201).json({
      status: 'success',
      message: 'Stock reserved and checkout session created successfully',
      checkoutSession: {
        orderId: order._id,
        order,
        idempotencyKey,
        reservationExpiresAt,
        summary: {
          subtotal,
          shipping,
          estimatedTax,
          totalAmount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCheckoutSession,
};
