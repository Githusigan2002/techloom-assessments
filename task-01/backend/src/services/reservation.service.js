import mongoose from "mongoose";
import Product from "../models/product.model.js";
import Reservation from "../models/reservation.model.js";

// 5 minutes expiry duration in milliseconds
const RESERVATION_EXPIRY_MS = 5 * 60 * 1000;

export const reservationService = {
    // Reserve stock for each item in the order
    async reserveStockForOrder(orderId, userId, items, session = null) {
        const reservedItems = [];

        try {
            for (const item of items) {
                const productId = item.product;
                const quantity = item.quantity;

                // Only reserve if availableStock is enough.
                // Doing this directly in MongoDB prevents race conditions and overselling.
                const queryOptions = session ? { new: true, session } : { new: true };
                const product = await Product.findOneAndUpdate(
                    {
                        _id: productId,
                        availableStock: { $gte: quantity },
                    },
                    {
                        $inc: {
                            availableStock: -quantity,
                            reservedStock: quantity,
                        },
                    },
                    queryOptions
                );

                // If no record was updated, someone else grabbed the stock first
                if (!product) {
                    const currentProduct = await Product.findById(productId);
                    const currentAvailable = currentProduct ? currentProduct.availableStock : 0;
                    throw new Error(
                        `Insufficient stock for "${item.name || "Product"}". Requested: ${quantity}, Available: ${currentAvailable}`
                    );
                }

                // Keep track of what we reserved so we can restore it if a later item fails
                reservedItems.push({
                    product: productId,
                    quantity: quantity,
                    price: item.price,
                });
            }

            // Lock inventory for 5 minutes
            const expiresAt = new Date(Date.now() + RESERVATION_EXPIRY_MS);

            const reservationData = {
                order: orderId,
                user: userId,
                items: reservedItems,
                status: "ACTIVE",
                expiresAt,
            };

            const reservation = session
                ? (await Reservation.create([reservationData], { session }))[0]
                : await Reservation.create(reservationData);

            return reservation;
        } catch (error) {
            // If running without a transaction session, manually undo any partial holds
            if (!session) {
                for (const reserved of reservedItems) {
                    await Product.findByIdAndUpdate(reserved.product, {
                        $inc: {
                            availableStock: reserved.quantity,
                            reservedStock: -reserved.quantity,
                        },
                    });
                }
            }
            throw error;
        }
    },

    // Put reserved stock back into inventory (on cancellation or failed payment)
    // The status: "ACTIVE" check prevents releasing the same reservation twice
    async releaseReservationStock(reservationId, session = null) {
        const queryOptions = session ? { new: true, session } : { new: true };

        const reservation = await Reservation.findOneAndUpdate(
            { _id: reservationId, status: "ACTIVE" },
            {
                status: "RELEASED",
                releasedAt: new Date(),
            },
            queryOptions
        );

        if (!reservation) {
            return null; // Already released or expired
        }

        // Return reserved items back to available stock
        for (const item of reservation.items) {
            const updateOptions = session ? { session } : {};
            await Product.findByIdAndUpdate(
                item.product,
                {
                    $inc: {
                        availableStock: item.quantity,
                        reservedStock: -item.quantity,
                    },
                },
                updateOptions
            );
        }

        return reservation;
    },

    // Payment succeeded: permanently deduct physical stock
    async confirmReservationStock(reservationId, session = null) {
        const queryOptions = session ? { new: true, session } : { new: true };

        const reservation = await Reservation.findOneAndUpdate(
            { _id: reservationId, status: "ACTIVE" },
            { status: "CONFIRMED" },
            queryOptions
        );

        if (!reservation) {
            return null;
        }

        for (const item of reservation.items) {
            const updateOptions = session ? { session } : {};
            await Product.findByIdAndUpdate(
                item.product,
                {
                    $inc: {
                        stock: -item.quantity,
                        reservedStock: -item.quantity,
                    },
                },
                updateOptions
            );
        }

        return reservation;
    },

    // 5-minute timer ran out: restore items to available stock
    async expireReservationStock(reservationId, session = null) {
        const queryOptions = session ? { new: true, session } : { new: true };

        const reservation = await Reservation.findOneAndUpdate(
            { _id: reservationId, status: "ACTIVE" },
            {
                status: "EXPIRED",
                releasedAt: new Date(),
            },
            queryOptions
        );

        if (!reservation) {
            return null;
        }

        for (const item of reservation.items) {
            const updateOptions = session ? { session } : {};
            await Product.findByIdAndUpdate(
                item.product,
                {
                    $inc: {
                        availableStock: item.quantity,
                        reservedStock: -item.quantity,
                    },
                },
                updateOptions
            );
        }

        return reservation;
    },
};
