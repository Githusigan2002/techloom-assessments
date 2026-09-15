const express = require('express');
const {
  getMyOrders,
  getOrderById,
  cancelOrder,
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.get('/my-orders', getMyOrders);
router.get('/:id', getOrderById);
router.post('/:id/cancel', cancelOrder);

module.exports = router;
