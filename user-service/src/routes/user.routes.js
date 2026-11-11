const express = require('express');
const router = express.Router();

const { getProfile } = require('../controllers/user.controller');
const { userContext } = require('../middlewares/user.Context');
router.get("/get-profile", userContext, getProfile);
module.exports = router;
// dont export as {router}