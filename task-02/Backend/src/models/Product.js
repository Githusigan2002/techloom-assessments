const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Product category is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
    },
    image: {
      type: String,
      trim: true,
      default: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
    },
    stock: {
      type: Number,
      required: [true, 'Stock count is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    reservedStock: {
      type: Number,
      required: true,
      min: [0, 'Reserved stock cannot be negative'],
      default: 0,
    },
    availability: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field: availableStock (calculated on the fly)
productSchema.virtual('availableStock').get(function () {
  const stock = typeof this.stock === 'number' ? this.stock : 0;
  const reserved = typeof this.reservedStock === 'number' ? this.reservedStock : 0;
  return Math.max(0, stock - reserved);
});

// Pre-save hook: auto-sync boolean availability flag before persist
productSchema.pre('save', function () {
  const stock = typeof this.stock === 'number' ? this.stock : 0;
  const reserved = typeof this.reservedStock === 'number' ? this.reservedStock : 0;
  this.availability = stock - reserved > 0;
});

// Text index for full-text search across name and description
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, price: 1 });

module.exports = mongoose.model('Product', productSchema);
