import mongoose from "mongoose";

// Schema for Mock Payments
const paymentSchema = new mongoose.Schema(
    {
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        paymentMethod: {
            type: String,
            default: "CARD",
        },
        // Outcome status: SUCCESS, FAILED, or TIMEOUT
        status: {
            type: String,
            enum: ["SUCCESS", "FAILED", "TIMEOUT"],
            required: true,
        },
        // Idempotency key to prevent double charging / duplicate submissions
        idempotencyKey: {
            type: String,
            required: true,
            unique: true,
        },
        // Generated transaction ID
        transactionId: {
            type: String,
            required: true,
            unique: true,
        },
    },
    {
        timestamps: true,
    }
);

paymentSchema.index({ order: 1 });

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
