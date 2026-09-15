import mongoose from "mongoose";

// Schema for items placed inside the shopping cart
const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: [true, "Product reference is required"],
    },
    name: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    quantity: {
        type: Number,
        required: [true, "Item quantity is required"],
        min: [1, "Quantity must be at least 1"],
        default: 1,
    },
});

// Schema for the User Cart
const cartSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true, // Each user has exactly one active cart
        },
        items: [cartItemSchema],
        totalAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    {
        timestamps: true,
    }
);

// recalculate total amount whenever items change
cartSchema.methods.calculateTotal = function () {
    this.totalAmount = this.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
    );
    // Round to 2 decimal places to avoid floating point issues
    this.totalAmount = Math.round(this.totalAmount * 100) / 100;
};

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
