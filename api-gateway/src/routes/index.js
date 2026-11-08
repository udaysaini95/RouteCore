const express = require('express');
const { requireAuth } = require('../middlewares/auth.middleware');
const { ipRateLimit, endpointRateLimit, combinedRateLimit } = require('../middlewares/rateLimiting.middleware');

const { config } = require('../config');

const router = express.Router();

const userServiceProxy = createProxy('userService', config.SERVICES.USER_SERVICE_URL);

// public route
router.post('/users/auth/login', endpointRateLimit(10, 900000), userServiceProxy) // 10 req per 15 min

// private route
router.get('/users/user/profile', requireAuth, combinedRateLimit(), userServiceProxy);

// health route
router.get('/gateway/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: "Api Gateway is Healthy",
        timestamp: new Date().toString()
    })
})

module.exports = router;

  