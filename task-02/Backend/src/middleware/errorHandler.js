class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// 404 Route Not Found Middleware
const notFoundHandler = (req, res, next) => {
  const error = new AppError(`Cannot find ${req.originalUrl} on this server`, 404);
  next(error);
};

// Global Centralized Error Handler Middleware
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';

  const response = {
    status,
    message: err.message || 'Internal server error',
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    if (err.name) response.errorName = err.name;
  }

  res.status(statusCode).json(response);
};

module.exports = {
  AppError,
  notFoundHandler,
  errorHandler,
};
