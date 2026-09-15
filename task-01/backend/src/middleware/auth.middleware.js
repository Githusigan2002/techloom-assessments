import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

// Middleware to authenticate user using JWT token
export const protect = async (req, res, next) => {
    let token;

    // Check if Authorization header exists and starts with "Bearer"
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer ")
    ) {
        try {
            // Extract the token part (Bearer <token>)
            token = req.headers.authorization.split(" ")[1];

            // Verify the token using the secret key
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Fetch the user from the database using decoded ID, exclude password
            req.user = await User.findById(decoded.id).select("-password");

            // If user no longer exists in database
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: "User not found, authorization denied",
                });
            }

            // Proceed to the next middleware or controller
            next();
        } catch (error) {
            console.error("Token verification failed:", error.message);
            return res.status(401).json({
                success: false,
                message: "Not authorized, invalid or expired token",
            });
        }
    }

    // If no token is found in the headers
    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Not authorized, no token provided",
        });
    }
};

// Protected-route middleware for role-based access control
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role '${req.user ? req.user.role : "unknown"}' is not authorized to access this route`,
            });
        }
        next();
    };
};
