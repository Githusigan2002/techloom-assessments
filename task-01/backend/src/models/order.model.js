import mongoose from "mongoose";

// Schema for items inside an order
const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
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
        required: true,
        min: 1,
    },
    itemTotal: {
        type: Number,
        required: true,
    },
});

// Schema for Orders
const orderSchema = new mongoose.Schema(
    {
        orderNumber: {
            type: String,
            required: true,
            unique: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        items: [orderItemSchema],
        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            enum: [
                "PENDING",
                "RESERVED",
                "PAID",
                "CANCELLED",
                "EXPIRED",
                "FAILED",
            ],
            default: "PENDING",
        },
        reservation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Reservation",
        },
        expiresAt: {
            type: Date,
        },
        paymentStatus: {
            type: String,
            enum: ["PENDING", "COMPLETED", "FAILED"],
            default: "PENDING",
        },
        idempotencyKey: {
            type: String,
            sparse: true,
            index: true,
        },
        cancellationReason: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

const Order = mongoose.model("Order", orderSchema);

export default Order;
