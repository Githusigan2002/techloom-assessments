const express = require('express');
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const productRoutes = require('./productRoutes');
const cartRoutes = require('./cartRoutes');
const checkoutRoutes = require('./checkoutRoutes');
const paymentRoutes = require('./paymentRoutes');
const orderRoutes = require('./orderRoutes');

const router = express.Router();

// Health check
router.use('/health', healthRoutes);

// Core Storefront APIs
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/checkout', checkoutRoutes);
router.use('/payments', paymentRoutes);
router.use('/orders', orderRoutes);

module.exports = router;
