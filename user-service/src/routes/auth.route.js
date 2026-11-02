const express = require('express');
const router = express.Router();

const { sendOTP, verifyOtp,login, rotateRefreshToken } = require('../controllers/auth.controller.js')

router.post("/send-otp", sendOTP);
router.post('/verify-otp', verifyOtp);
router.post("/login", login);
router.get("/refresh",rotateRefreshToken)
module.exports = router;