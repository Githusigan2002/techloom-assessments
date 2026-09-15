import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import { generateToken } from "../utils/jwt.js";

//Signup new user
export const register = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        //check if required fields are provided
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide username, email, and password",
            });
        }

        // Check if email is already registered
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: "A user with this email already exists",
            });
        }

        // Check if username is already taken
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({
                success: false,
                message: "This username is already taken",
            });
        }

        // Hash the password using bcryptjs
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create and save the new user
        const newUser = await User.create({
            username,
            email,
            password: hashedPassword,
            role: role || "user", // Default to 'user' if not specified
        });

        //Generate JWT token for the user
        const token = generateToken(newUser._id, newUser.role);

        //Send response back (don't include password in response)
        res.status(201).json({
            success: true,
            message: "User registered successfully",
            token,
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role,
            },
        });
    } catch (error) {
        console.error("Error in registration:", error);
        res.status(500).json({
            success: false,
            message: "Server error during registration",
            error: error.message,
        });
    }
};

// User Login

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Step 1: Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide both email and password",
            });
        }

        // Step 2: Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // Step 3: Compare entered password with stored hashed password
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // Step 4: Generate JWT token
        const token = generateToken(user._id, user.role);

        // Step 5: Send response back
        res.status(200).json({
            success: true,
            message: "Logged in successfully",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Error in login:", error);
        res.status(500).json({
            success: false,
            message: "Server error during login",
            error: error.message,
        });
    }
};

// Get currently logged in user profile
export const getCurrentUser = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            user: req.user,
        });
    } catch (error) {
        console.error("Error in getCurrentUser:", error);
        res.status(500).json({
            success: false,
            message: "Server error fetching user profile",
            error: error.message,
        });
    }
};
