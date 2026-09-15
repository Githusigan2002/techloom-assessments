import mongoose from "mongoose";

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error("MONGODB_URI environment variable is missing. Please add MONGODB_URI in your Vercel project Settings -> Environment Variables.");
        }

        cached.promise = mongoose
            .connect(mongoUri)
            .then((mongooseInstance) => {
                console.log("MongoDB connected");
                return mongooseInstance;
            });
    }

    try {
        cached.conn = await cached.promise;
    } catch (error) {
        cached.promise = null;
        console.error("MongoDB connection error", error);
        throw error;
    }

    return cached.conn;
};

export default connectDB;