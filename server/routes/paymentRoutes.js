const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/config', paymentController.getPublicConfig);
router.post('/create-order', paymentController.createOrder);
router.post('/verify', paymentController.verifyPayment);
router.post('/payout', protect, authorize('SuperAdmin', 'FinanceManager'), paymentController.createPayout);

module.exports = router;
