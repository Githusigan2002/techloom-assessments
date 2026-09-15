const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Cart item must reference a product'],
    },
    quantity: {
      type: Number,
      required: [true, 'Item quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },
    price: {
      type: Number,
      min: [0, 'Item price cannot be negative'],
      default: 0,
    },
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      sparse: true,
    },
    sessionId: {
      type: String,
      index: true,
      sparse: true,
    },
    items: [cartItemSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field: total item count
cartSchema.virtual('itemCount').get(function () {
  if (!this.items) return 0;
  return this.items.reduce((total, item) => total + (item.quantity || 0), 0);
});

// Virtual field: cart total amount
cartSchema.virtual('totalAmount').get(function () {
  if (!this.items) return 0;
  const total = this.items.reduce((sum, item) => sum + (item.quantity || 0) * (item.price || 0), 0);
  return Number(total.toFixed(2));
});

module.exports = mongoose.model('Cart', cartSchema);
