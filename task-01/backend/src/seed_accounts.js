import mongoose from "mongoose";
import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = mongoose.connection.collection("users");

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("password123", salt);

        // 1. Admin Account
        await users.updateOne(
            { email: "admin@pos.com" },
            {
                $set: {
                    username: "admin",
                    email: "admin@pos.com",
                    password: hashedPassword,
                    role: "admin",
                    updatedAt: new Date(),
                },
                $setOnInsert: { createdAt: new Date() },
            },
            { upsert: true }
        );

        // 2. Cashier / User Account
        await users.updateOne(
            { email: "cashier@pos.com" },
            {
                $set: {
                    username: "cashier",
                    email: "cashier@pos.com",
                    password: hashedPassword,
                    role: "user",
                    updatedAt: new Date(),
                },
                $setOnInsert: { createdAt: new Date() },
            },
            { upsert: true }
        );

        console.log("=========================================");
        console.log("DEFAULT LOGIN CREDENTIALS READY:");
        console.log("-----------------------------------------");
        console.log("1. Administrator:");
        console.log("   Email:    admin@pos.com");
        console.log("   Username: admin");
        console.log("   Password: password123");
        console.log("   Role:     admin");
        console.log("-----------------------------------------");
        console.log("2. Cashier / User:");
        console.log("   Email:    cashier@pos.com");
        console.log("   Username: cashier");
        console.log("   Password: password123");
        console.log("   Role:     user");
        console.log("=========================================");

        await mongoose.disconnect();
    } catch (err) {
        console.error("Failed to seed accounts:", err);
        process.exit(1);
    }
};

seed();
