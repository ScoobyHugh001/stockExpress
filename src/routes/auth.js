const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticate = require('../middleware/auth');

// Page routes
router.get('/login', authController.getLoginPage);
router.get('/signup', authController.getSignupPage);

// API routes
router.post('/api/auth/signup', authController.signup);
router.post('/api/auth/login', authController.login);
router.get('/api/auth/me', authenticate, authController.me);

module.exports = router;
