import jwt from "jsonwebtoken";

// Helper function to generate a JSON Web Token (JWT)
// Takes user ID and role to store in token payload
export const generateToken = (userId, role) => {
    return jwt.sign(
        { id: userId, role: role },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "1d", // Defaults to 1 day if not set
        }
    );
};
