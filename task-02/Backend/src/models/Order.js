const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Order item must have a product reference'],
    },
    name: {
      type: String,
      required: [true, 'Order item name snapshot is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Order item quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    price: {
      type: Number,
      required: [true, 'Order item price is required'],
      min: [0, 'Price cannot be negative'],
    },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Order must belong to a user'],
      index: true,
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: function (items) {
          return items && items.length > 0;
        },
        message: 'An order must contain at least one item',
      },
    },
    totalAmount: {
      type: Number,
      required: [true, 'Order total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'processing', 'completed', 'cancelled', 'refunded'],
        message: '{VALUE} is not a valid order status',
      },
      default: 'pending',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ['unpaid', 'paid', 'failed', 'refunded'],
        message: '{VALUE} is not a valid payment status',
      },
      default: 'unpaid',
      index: true,
    },
    reservationStatus: {
      type: String,
      enum: {
        values: ['none', 'reserved', 'released', 'consumed'],
        message: '{VALUE} is not a valid reservation status',
      },
      default: 'none',
      index: true,
    },
    reservationExpiresAt: {
      type: Date,
      index: true,
    },
    shippingAddress: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      postalCode: { type: String, default: '' },
      country: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for order history and fast query filters
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ reservationStatus: 1, reservationExpiresAt: 1 });

module.exports = mongoose.model('Order', orderSchema);
