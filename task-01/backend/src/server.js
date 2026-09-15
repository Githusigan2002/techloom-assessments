import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import orderRoutes from "./routes/order.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import { startExpiryJob, processExpiredReservations } from "./services/expiryJob.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";

dotenv.config();

const app = express();

// Standard middleware
app.use(cors());
app.use(express.json());

// Serverless DB connection middleware (ensures active connection across invocations)
app.use(async (req, res, next) => {
    try {
        await connectDB();
        // In serverless environments where setInterval isn't persistent, run a lazy scan
        if (process.env.VERCEL) {
            processExpiredReservations().catch(() => {});
        }
        next();
    } catch (error) {
        next(error);
    }
});

// Base health check route
app.get("/", (req, res) => {
    res.json({
        message: "POS Order & Inventory System API is running",
        timestamp: new Date().toISOString(),
    });
});

// Expiry trigger route (useful for cron ping or manual verification)
app.get("/api/cron/expire", async (req, res) => {
    await processExpiredReservations();
    res.json({ message: "Expired reservations processed successfully", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);

// 404 Route Handler
app.use(notFound);

// Centralized Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();

        // Start background worker for automatic 5-minute reservation expiration
        startExpiryJob(10000); // Scans every 10 seconds

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

// Start standalone HTTP listener when running locally or on persistent hosts (e.g. Render/Railway)
if (!process.env.VERCEL) {
    startServer();
}

export default app;

