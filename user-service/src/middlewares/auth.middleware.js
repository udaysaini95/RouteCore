const asyncHandler = require("../utils/asyncHandler");
const { verifyAccessToken } = require("../utils/auth");
const { UnauthorizedError } = require("../utils/error");


const requireAuth = asyncHandler((req, res, next) => {
    // const authHeader = req.headers.authorization;
    // only works if suth header is send explictly while making request from server 
    // so we take access token from cookies 

    const token = req.cookies?.accessToken || (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.split(" ")[1] : null);
    if (!token) {
        throw new UnauthorizedError("Authentication Required");
    }

    try {
        const decoded = verifyAccessToken(token);
        req.user = {
            id: decoded.id,
        }
        return next();
    } catch (error) {
        throw new UnauthorizedError("Invalid Token");
    }
})

module.exports = { requireAuth };