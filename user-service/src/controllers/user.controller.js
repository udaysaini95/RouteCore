const asyncHandler = require("../utils/asyncHandler");

exports.getProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    if (!userId)
    {
        
        
    }
})