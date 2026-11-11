const asyncHandler = require("../utils/asyncHandler");
const { UnauthorizedError } = require("../utils/error");

const userContext = asyncHandler((req, res, next) => {
    const userId = req.headers["x-user-id"];

    if (!userId) {
        throw new UnauthorizedError("Unauthorized: Missing user identity header", "UNAUTHORIZED");
    }

    req.user = { id: userId };
    return next();
});

module.exports = { userContext };