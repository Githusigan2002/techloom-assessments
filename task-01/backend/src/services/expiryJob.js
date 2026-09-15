import Reservation from "../models/reservation.model.js";
import Order from "../models/order.model.js";
import { reservationService } from "./reservation.service.js";

let intervalId = null;

// Core logic to scan and expire reservations that have exceeded their 5-minute window
export const processExpiredReservations = async () => {
    try {
        const now = new Date();

        // Find reservations that reached their 5-minute limit without being paid
        const expiredReservations = await Reservation.find({
            status: "ACTIVE",
            expiresAt: { $lte: now },
        });

        if (expiredReservations.length > 0) {
            console.log(`[ExpiryJob] Found ${expiredReservations.length} expired reservation(s). Releasing stock...`);

            for (const reservation of expiredReservations) {
                // Put the items back in stock
                const updatedRes = await reservationService.expireReservationStock(reservation._id);

                if (updatedRes) {
                    // Mark order expired so customer cannot pay for it anymore
                    await Order.findOneAndUpdate(
                        { _id: reservation.order, status: "RESERVED" },
                        {
                            status: "EXPIRED",
                            paymentStatus: "FAILED",
                        }
                    );
                    console.log(`[ExpiryJob] Successfully expired reservation ${reservation._id} and restored stock.`);
                }
            }
        }
    } catch (error) {
        console.error("[ExpiryJob] Error running reservation expiry job:", error.message);
    }
};

// Background worker that runs every intervalMs to scan for expired reservations
export const startExpiryJob = (intervalMs = 10000) => {
    if (intervalId) return;

    console.log(`[ExpiryJob] Automatic reservation scanner started (Interval: ${intervalMs}ms)`);

    intervalId = setInterval(processExpiredReservations, intervalMs);
};

export const stopExpiryJob = () => {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        console.log("[ExpiryJob] Automatic reservation scanner stopped.");
    }
};
