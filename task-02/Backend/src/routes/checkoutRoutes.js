const express = require('express');
const { createCheckoutSession } = require('../controllers/checkoutController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.post('/session', createCheckoutSession);

module.exports = router;
