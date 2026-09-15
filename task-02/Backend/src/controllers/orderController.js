const crypto = require('crypto');
const { Order, Payment } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const inventoryService = require('../services/inventoryService');

// Phase 11: Get Customer Order History
const getMyOrders = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('items.product');

    res.status(200).json({
      status: 'success',
      results: orders.length,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

// Phase 11: Get Individual Order Details
const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const order = await Order.findOne({ _id: id, user: userId }).populate('items.product');

    if (!order) {
      return next(new AppError('Order not found or unauthorized', 404));
    }

    const payment = await Payment.findOne({ order: order._id });

    res.status(200).json({
      status: 'success',
      order,
      payment,
    });
  } catch (error) {
    next(error);
  }
};

// Phase 12: Order Cancellation & Inventory Restock / Mock Refund
const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const order = await Order.findOne({ _id: id, user: userId });

    if (!order) {
      return next(new AppError('Order not found or unauthorized', 404));
    }

    if (order.status === 'cancelled') {
      return next(new AppError('This order is already cancelled', 400));
    }

    let refundInfo = null;

    if (order.paymentStatus === 'paid') {
      // 1. Paid order cancellation -> Issue Mock Refund & Restock Sold Inventory
      const refundId = `ref_mock_${crypto.randomBytes(8).toString('hex')}`;

      // Update payment record
      const payment = await Payment.findOneAndUpdate(
        { order: order._id },
        {
          status: 'refunded',
          refundId,
          refundedAmount: order.totalAmount,
        },
        { new: true }
      );

      // Phase 12 Requirement: Restore sold stock to available inventory (stock += quantity)
      await inventoryService.restockSoldItems(order.items);

      order.status = 'cancelled';
      order.paymentStatus = 'refunded';
      await order.save();

      refundInfo = {
        refundId,
        refundedAmount: order.totalAmount,
        status: 'refunded',
        restockedItemsCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      };
    } else if (order.reservationStatus === 'reserved') {
      // 2. Unpaid reserved order -> Release reservation lock back to available stock
      await inventoryService.releaseReservation(order.items);

      order.status = 'cancelled';
      order.reservationStatus = 'released';
      order.paymentStatus = 'failed';
      await order.save();

      refundInfo = {
        refundId: null,
        refundedAmount: 0,
        status: 'reservation_released',
        restockedItemsCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      };
    } else {
      order.status = 'cancelled';
      await order.save();
    }

    res.status(200).json({
      status: 'success',
      message: 'Order cancelled successfully and inventory was restored.',
      order,
      refund: refundInfo,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyOrders,
  getOrderById,
  cancelOrder,
};
