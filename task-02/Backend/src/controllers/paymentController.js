const crypto = require('crypto');
const { Order, Payment, Cart } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const inventoryService = require('../services/inventoryService');


const processPayment = async (req, res, next) => {
  try {
    const { orderId, idempotencyKey, outcome = 'SUCCESS', paymentMethod = 'credit_card' } = req.body;
    const userId = req.user._id;

    if (!orderId) {
      return next(new AppError('Order ID is required to process payment', 400));
    }
    if (!idempotencyKey) {
      return next(new AppError('Idempotency key is required to protect against duplicate payments', 400));
    }

    // Duplicate Payment Protection 
    const existingPayment = await Payment.findOne({ idempotencyKey });
    if (existingPayment) {
      console.log(`Duplicate payment attempt detected with key: ${idempotencyKey}. Returning cached response.`);
      const associatedOrder = await Order.findById(existingPayment.order);
      return res.status(200).json({
        status: 'success',
        isDuplicate: true,
        message: 'Duplicate payment request detected. Returned original payment result without re-processing.',
        payment: existingPayment,
        order: associatedOrder,
      });
    }

    // Locate order and verify ownership
    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
      return next(new AppError('Order not found or unauthorized', 404));
    }

    // Check if order was already completed/paid
    if (order.paymentStatus === 'paid') {
      let paymentRecord = await Payment.findOne({ idempotencyKey });
      if (!paymentRecord) {
        for (let i = 0; i < 5 && !paymentRecord; i++) {
          await new Promise((r) => setTimeout(r, 60));
          paymentRecord = await Payment.findOne({ idempotencyKey });
        }
      }
      if (paymentRecord) {
        return res.status(200).json({
          status: 'success',
          isDuplicate: true,
          message: 'Duplicate payment request detected. Returned original payment result without re-processing.',
          payment: paymentRecord,
          order,
        });
      }
      return next(new AppError('This order has already been paid for.', 400));
    }

    // Check if reservation is still active
    if (order.reservationStatus !== 'reserved') {
      return next(
        new AppError(
          `Cannot process payment. Reservation status is "${order.reservationStatus}". Please initiate a new checkout session.`,
          400
        )
      );
    }

    // Check if reservation expired
    if (order.reservationExpiresAt && new Date() > order.reservationExpiresAt) {
      // Auto-release expired reservation
      await inventoryService.releaseReservation(order.items);
      order.status = 'cancelled';
      order.reservationStatus = 'released';
      order.paymentStatus = 'failed';
      await order.save();
      return next(
        new AppError('Checkout reservation expired. Reserved items have been released.', 400)
      );
    }

    // Generate unique payment identifier
    const paymentId = `pay_mock_${crypto.randomBytes(10).toString('hex')}`;

    // Mock Payment Gateway Simulation 
    const simulatedOutcome = outcome.toUpperCase();

    if (simulatedOutcome === 'FAILED') {
      // Payment Failed Scenario: Atomically transition order and release reservation
      const updatedOrder = await Order.findOneAndUpdate(
        { _id: orderId, reservationStatus: 'reserved' },
        {
          $set: {
            status: 'cancelled',
            paymentStatus: 'failed',
            reservationStatus: 'released',
          },
        },
        { returnDocument: 'after' }
      );

      if (!updatedOrder) {
        const existingPayment = await Payment.findOne({ idempotencyKey });
        if (existingPayment) {
          return res.status(200).json({
            status: 'success',
            isDuplicate: true,
            payment: existingPayment,
            order: await Order.findById(orderId),
          });
        }
        return next(new AppError('Order reservation is no longer active', 400));
      }

      await inventoryService.releaseReservation(updatedOrder.items);

      const failedPayment = await Payment.create({
        order: updatedOrder._id,
        paymentId,
        status: 'failed',
        amount: updatedOrder.totalAmount,
        idempotencyKey,
        failureReason: 'Mock Payment Gateway: Card declined (simulated failure).',
      });

      return res.status(402).json({
        status: 'fail',
        message: 'Payment was declined by the simulated gateway.',
        reason: failedPayment.failureReason,
        payment: failedPayment,
        order: updatedOrder,
      });
    }

    if (simulatedOutcome === 'TIMEOUT') {
      // Payment Timeout Scenario: Atomically transition order and release reservation
      const updatedOrder = await Order.findOneAndUpdate(
        { _id: orderId, reservationStatus: 'reserved' },
        {
          $set: {
            status: 'cancelled',
            paymentStatus: 'failed',
            reservationStatus: 'released',
          },
        },
        { returnDocument: 'after' }
      );

      if (!updatedOrder) {
        const existingPayment = await Payment.findOne({ idempotencyKey });
        if (existingPayment) {
          return res.status(200).json({
            status: 'success',
            isDuplicate: true,
            payment: existingPayment,
            order: await Order.findById(orderId),
          });
        }
        return next(new AppError('Order reservation is no longer active', 400));
      }

      await inventoryService.releaseReservation(updatedOrder.items);

      const timeoutPayment = await Payment.create({
        order: updatedOrder._id,
        paymentId,
        status: 'failed',
        amount: updatedOrder.totalAmount,
        idempotencyKey,
        failureReason: 'Mock Payment Gateway: Gateway timed out after 30s (simulated timeout). Reservation released.',
      });

      return res.status(408).json({
        status: 'timeout',
        message: 'Payment timed out. Reserved stock has been safely released.',
        reason: timeoutPayment.failureReason,
        payment: timeoutPayment,
        order: updatedOrder,
      });
    }

    // 3. Payment Success Scenario (Phase 10: Order Creation & Stock Finalization)
    // Atomically transition reservationStatus so concurrent parallel requests cannot double-consume stock
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: orderId, reservationStatus: 'reserved' },
      {
        $set: {
          status: 'completed',
          paymentStatus: 'paid',
          reservationStatus: 'consumed',
        },
      },
      { returnDocument: 'after' }
    );

    if (!updatedOrder) {
      // Parallel concurrent request won the race
      let existingPayment = await Payment.findOne({ idempotencyKey });
      if (!existingPayment) {
        for (let i = 0; i < 5 && !existingPayment; i++) {
          await new Promise((resolve) => setTimeout(resolve, 60));
          existingPayment = await Payment.findOne({ idempotencyKey });
        }
      }
      if (existingPayment) {
        return res.status(200).json({
          status: 'success',
          isDuplicate: true,
          message: 'Duplicate payment request detected. Returned original payment result without re-processing.',
          payment: existingPayment,
          order: await Order.findById(orderId),
        });
      }
      return next(new AppError('Payment already processed or reservation expired.', 400));
    }

    // Convert reserved stock into permanently sold stock exactly once
    await inventoryService.consumeReservation(updatedOrder.items);

    const successfulPayment = await Payment.create({
      order: updatedOrder._id,
      paymentId,
      status: 'succeeded',
      amount: updatedOrder.totalAmount,
      idempotencyKey,
      failureReason: null,
    });

    // Clear the customer's cart
    await Cart.findOneAndUpdate({ user: userId }, { items: [] });

    res.status(200).json({
      status: 'success',
      isDuplicate: false,
      message: 'Payment processed successfully! Order confirmed.',
      payment: successfulPayment,
      order: updatedOrder,
    });
  } catch (error) {
    // Handle concurrent duplicate key race condition (MongoDB E11000)
    if (error.code === 11000) {
      const idempotencyKey = req.body.idempotencyKey;
      let existingPayment = await Payment.findOne({ idempotencyKey });
      if (!existingPayment) {
        await new Promise((resolve) => setTimeout(resolve, 60));
        existingPayment = await Payment.findOne({ idempotencyKey });
      }
      if (existingPayment) {
        const associatedOrder = await Order.findById(existingPayment.order);
        return res.status(200).json({
          status: 'success',
          isDuplicate: true,
          message: 'Duplicate payment request detected. Returned original payment result without re-processing.',
          payment: existingPayment,
          order: associatedOrder,
        });
      }
    }
    next(error);
  }
};

module.exports = {
  processPayment,
};
