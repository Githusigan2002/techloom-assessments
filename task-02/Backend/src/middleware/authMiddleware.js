const { verifyToken } = require('../utils/jwt');
const { User } = require('../models');
const { AppError } = require('./errorHandler');

// Protect routes: Enforce valid JWT Bearer token
const protect = async (req, res, next) => {
  try {
    let token = null;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in. Please log in to gain access.', 401));
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return next(new AppError('Invalid or expired token. Please log in again.', 401));
    }

    // Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(
        new AppError('The user belonging to this token no longer exists.', 401)
      );
    }

    // Attach user to request
    req.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
};

// Optional auth: Identifies user if token is provided, without blocking unauthenticated requests
const optionalAuth = async (req, res, next) => {
  try {
    let token = null;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = verifyToken(token);
        const currentUser = await User.findById(decoded.id);
        if (currentUser) {
          req.user = currentUser;
        }
      } catch (err) {
        // Token invalid, proceed as guest
        req.user = null;
      }
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Restrict to specified roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

module.exports = {
  protect,
  optionalAuth,
  restrictTo,
};
