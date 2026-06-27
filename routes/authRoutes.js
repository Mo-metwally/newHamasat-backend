const express = require('express');
const authController = require('../controllers/authController');
const authService = require("../services/authService");

const router = express.Router();

// POST /api/auth/login
router.post('/login', authController.signInController);

// POST /api/auth/vendor-register
router.post('/vendor-register', authController.vendorRegisterController);

// POST /api/auth/send-registration-otp
router.post('/send-registration-otp', authController.sendRegistrationOTPController);

// POST /api/auth/verify-registration-otp
router.post('/verify-registration-otp', authController.verifyRegistrationOTPController);

// POST /api/auth/logout
router.post('/logout', authController.logoutController);

// GET /api/auth/user
router.get('/check-user', authService.protect, authController.meController);

// POST /api/auth/forgot-password
router.post('/forgot-password', authController.forgotPasswordController);

// POST /api/auth/verify-otp
router.post('/verify-otp', authController.verifyOTPController);

// POST /api/auth/reset-password
router.post('/reset-password', authController.resetPasswordController);

module.exports = router;
