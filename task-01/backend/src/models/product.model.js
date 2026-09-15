import mongoose from "mongoose";

// Schema for Products in the POS system
const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Product name is required"],
            trim: true,
        },

        // Stock Keeping Unit - Unique identifier for each product item
        sku: {
            type: String,
            required: [true, "Product SKU is required"],
            unique: true,
            uppercase: true,
            trim: true,
        },

        description: {
            type: String,
            default: "",
            trim: true,
        },

        category: {
            type: String,
            default: "General",
            trim: true,
        },

        price: {
            type: Number,
            required: [true, "Product price is required"],
            min: [0, "Price cannot be negative"],
        },

        // Total physical stock count in the inventory
        stock: {
            type: Number,
            required: [true, "Stock quantity is required"],
            min: [0, "Stock cannot be negative"],
            default: 0,
        },

        // Stock that is currently reserved in active customer checkouts
        reservedStock: {
            type: Number,
            default: 0,
            min: [0, "Reserved stock cannot be negative"],
        },

        // Persisted available stock for atomic concurrency queries: availableStock = stock - reservedStock
        availableStock: {
            type: Number,
            default: 0,
            min: [0, "Available stock cannot be negative"],
        },
    },
    {
        // Automatically manages createdAt and updatedAt
        timestamps: true,
    }
);

// Before saving, ensure availableStock is always in sync: availableStock = stock - reservedStock
productSchema.pre("save", function () {
    if (this.isModified("stock") || this.isModified("reservedStock") || this.isNew) {
        this.availableStock = Math.max(0, this.stock - this.reservedStock);
    }
});

// Database indexes for fast lookups
productSchema.index({ availableStock: 1 });

const Product = mongoose.model("Product", productSchema);

export default Product;
