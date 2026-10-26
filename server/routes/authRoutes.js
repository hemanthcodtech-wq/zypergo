const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);
router.post('/login-password', authController.loginWithPassword);
router.post('/register', authController.register);
router.post('/register-rider', authController.riderApply);
router.post('/rider-apply', authController.riderApply);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/google', authController.googleLogin);

router.get('/me', protect, authController.getMe);

module.exports = router;
