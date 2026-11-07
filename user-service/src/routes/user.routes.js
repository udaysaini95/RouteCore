const express = require('express');
const router = express.Router();

const { getProfile } = require('../controllers/user.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
router.get("/get-profile", requireAuth,getProfile);
module.exports = router;
// dont export as {router}