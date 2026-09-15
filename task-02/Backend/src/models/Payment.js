const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Payment must be associated with an order'],
      index: true,
    },
    paymentId: {
      type: String,
      required: [true, 'Payment ID is required'],
      unique: true,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'succeeded', 'failed', 'refunded'],
        message: '{VALUE} is not a valid payment status',
      },
      default: 'pending',
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    idempotencyKey: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
      index: true,
    },
    failureReason: {
      type: String,
      default: null,
      trim: true,
    },
    refundId: {
      type: String,
      default: null,
      trim: true,
    },
    refundedAmount: {
      type: Number,
      min: [0, 'Refunded amount cannot be negative'],
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

paymentSchema.index({ order: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
