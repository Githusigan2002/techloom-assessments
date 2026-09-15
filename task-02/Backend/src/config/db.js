const mongoose = require('mongoose');
const { Product } = require('../models');
const sampleProducts = require('../utils/seedData');

const seedInitialProducts = async () => {
  try {
    const count = await Product.countDocuments();
    if (count === 0) {
      await Product.insertMany(sampleProducts);
      console.log('Product catalog seeded successfully');
    }
  } catch (err) {
    console.error('Failed to seed products:', err.message);
  }
};

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is missing');
    }
    const conn = await mongoose.connect(uri);
    console.log('MongoDB connected successfully');
    await seedInitialProducts();
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
      process.exit(1);
    }
    throw error;
  }
};

module.exports = connectDB;
