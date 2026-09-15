const express = require('express');
const { processPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.post('/process', processPayment);

module.exports = router;
