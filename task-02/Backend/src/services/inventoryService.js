const { Product, Order } = require('../models');

// Atomically reserve stock for all items in a checkout session.

const reserveStock = async (items) => {
  const reservedItems = [];

  try {
    for (const item of items) {
      const productId = item.product._id || item.product;
      const quantity = item.quantity;

      // Atomically check availableStock >= quantity and increment reservedStock
      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: productId,
          $expr: {
            $gte: [{ $subtract: ['$stock', '$reservedStock'] }, quantity],
          },
        },
        {
          $inc: { reservedStock: quantity },
        },
        { new: true }
      );

      if (!updatedProduct) {
        // Find product to provide informative error message
        const currentProduct = await Product.findById(productId);
        const name = currentProduct ? currentProduct.name : 'Unknown item';
        const available = currentProduct ? currentProduct.availableStock : 0;
        throw new Error(
          `Insufficient stock for "${name}". Requested ${quantity}, but only ${available} available.`
        );
      }

      reservedItems.push({ productId, quantity });
    }

    return { success: true, reservedItems };
  } catch (error) {
    // Rollback any items reserved before the failure
    for (const resItem of reservedItems) {
      await Product.findByIdAndUpdate(resItem.productId, {
        $inc: { reservedStock: -resItem.quantity },
      });
    }
    throw error;
  }
};

// Release reserved stock back into available stock.

const releaseReservation = async (items) => {
  for (const item of items) {
    const productId = item.product._id || item.product;
    const quantity = item.quantity;

    await Product.findByIdAndUpdate(productId, {
      $inc: { reservedStock: -quantity },
    });
  }
};

// Consume reservation upon successful payment.
const consumeReservation = async (items) => {
  for (const item of items) {
    const productId = item.product._id || item.product;
    const quantity = item.quantity;

    await Product.findByIdAndUpdate(productId, {
      $inc: {
        stock: -quantity,
        reservedStock: -quantity,
      },
    });
  }
};

// Restock sold items upon order cancellation & refund.
const restockSoldItems = async (items) => {
  for (const item of items) {
    const productId = item.product._id || item.product;
    const quantity = item.quantity;

    await Product.findByIdAndUpdate(productId, {
      $inc: { stock: quantity },
      $set: { availability: true },
    });
  }
};

// Background auto-release job: Finds any expired reserved orders and releases their stock.
const releaseExpiredReservations = async () => {
  try {
    const now = new Date();
    const expiredOrders = await Order.find({
      status: 'pending',
      reservationStatus: 'reserved',
      reservationExpiresAt: { $lt: now },
    });

    for (const order of expiredOrders) {
      console.log(`Auto-releasing expired reservation for Order #${order._id}`);
      await releaseReservation(order.items);
      order.status = 'cancelled';
      order.reservationStatus = 'released';
      order.paymentStatus = 'failed';
      await order.save();
    }
  } catch (err) {
    console.error('Error during auto-release sweeper:', err.message);
  }
};

module.exports = {
  reserveStock,
  releaseReservation,
  consumeReservation,
  restockSoldItems,
  releaseExpiredReservations,
};
