const { User } = require('../models');
const { signToken } = require('../utils/jwt');
const { AppError } = require('../middleware/errorHandler');

// Format user payload without password
const sanitizeUser = (user) => {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    address: user.address,
    createdAt: user.createdAt,
  };
};

// Register
const register = async (req, res, next) => {
  try {
    const { name, email, password, address } = req.body;

    if (!name || !email || !password) {
      return next(new AppError('Please provide name, email, and password', 400));
    }

    // Check if email already registered
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return next(new AppError('Email is already registered. Please login instead.', 400));
    }

    const newUser = await User.create({
      name,
      email,
      password,
      address,
    });

    const token = signToken(newUser._id);

    res.status(201).json({
      status: 'success',
      token,
      user: sanitizeUser(newUser),
    });
  } catch (error) {
    next(error);
  }
};

// Login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    // Find user and explicitly select password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Incorrect email or password', 401));
    }

    const token = signToken(user._id);

    res.status(200).json({
      status: 'success',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// Get Current User (Protected)
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      status: 'success',
      user: sanitizeUser(req.user),
    });
  } catch (error) {
    next(error);
  }
};

// Logout
const logout = async (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
};

module.exports = {
  register,
  login,
  getMe,
  logout,
};
