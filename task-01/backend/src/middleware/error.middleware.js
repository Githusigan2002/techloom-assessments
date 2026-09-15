// Custom error class for API errors
export class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

// 404 Not Found handler for undefined API routes
export const notFound = (req, res, next) => {
    const error = new AppError(`Not Found - ${req.originalUrl}`, 404);
    next(error);
};

// Centralized error handling middleware
export const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal server error";

    // Handle MongoDB Invalid ObjectId (CastError)
    if (err.name === "CastError") {
        statusCode = 404;
        message = `Resource not found with id: ${err.value}`;
    }

    // Handle MongoDB Duplicate Key error (Code 11000)
    if (err.code === 11000) {
        statusCode = 400;
        const field = Object.keys(err.keyValue || {})[0];
        message = `Duplicate value entered for field: '${field}'. Please use another value.`;
    }

    // Handle Mongoose Schema Validation error
    if (err.name === "ValidationError") {
        statusCode = 400;
        message = Object.values(err.errors)
            .map((val) => val.message)
            .join(", ");
    }

    // Handle JWT errors
    if (err.name === "JsonWebTokenError") {
        statusCode = 401;
        message = "Invalid token. Authorization denied.";
    }

    if (err.name === "TokenExpiredError") {
        statusCode = 401;
        message = "Token has expired. Please log in again.";
    }

    console.error(`[Error] ${statusCode} - ${message}`);

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
};
