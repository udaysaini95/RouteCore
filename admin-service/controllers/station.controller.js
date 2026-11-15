const asyncHandler = require("../utils/asyncHandler");
const { BadRequestError } = require("../utils/error");



exports.createStation = asyncHandler(async (req, res) => {
    const { name, code, city, state } = req.body;
    if (!name || !code || !city || state)
    {
        throw new BadRequestError("Insufficient data");
    }

    const station = await adminService.createStation(
        {
            code: code.toUpperCase(),
            name,
            city,
            state
        }
    );

    return res.status(201).json({
        success:true,
        message: "Station Created",
        data:station
    })
})