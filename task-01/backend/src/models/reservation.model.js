import mongoose from "mongoose";

// Schema for Stock Reservations during checkout
const reservationSchema = new mongoose.Schema(
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
        items: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: 1,
                },
                price: {
                    type: Number,
                    required: true,
                    min: 0,
                },
            },
        ],
        status: {
            type: String,
            enum: ["ACTIVE", "CONFIRMED", "RELEASED", "EXPIRED"],
            default: "ACTIVE",
        },
        // 5-minute expiry timestamp
        expiresAt: {
            type: Date,
            required: true,
        },
        releasedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Database index to quickly find active expired reservations for the background job
reservationSchema.index({ status: 1, expiresAt: 1 });

const Reservation = mongoose.model("Reservation", reservationSchema);

export default Reservation;
