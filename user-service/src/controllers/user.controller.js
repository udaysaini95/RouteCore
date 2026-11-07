const asyncHandler = require("../utils/asyncHandler");
const { BadRequestError } = require("../utils/error");

const userService = require('../services/user.service');

exports.getProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    if (!userId)
    {
        throw new BadRequestError("User Id is Missing")
    }

    const user = await userService.getProfile;
    return res.status(200).json({
        message: "Fetched user Details",
        success: true,
        data: {
            user
        }
    })
})

