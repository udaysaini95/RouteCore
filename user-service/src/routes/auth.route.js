const express = require('express');
const router = express.Router();

const { sendOTP, verifyOtp } = require('../controllers/auth.controller.js')

router.post("/send-otp", sendOTP);
router.post('/verify-otp', verifyOtp);

module.exports = router;