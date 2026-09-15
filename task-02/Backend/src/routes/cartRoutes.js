const express = require('express');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require('../controllers/cartController');
const { optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply optionalAuth so user ID is detected if token exists, else guest session is used
router.use(optionalAuth);

router.route('/')
  .get(getCart)
  .post(addToCart)
  .delete(clearCart);

router.route('/:itemId')
  .put(updateCartItem)
  .delete(removeCartItem);

module.exports = router;
