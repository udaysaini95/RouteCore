const { UnauthorizedError } = require("../utils/error");
const jwt = require("jsonwebtoken");
const { config } = require("../config");

const requireAuth = (req, res, next) => {
    // const authHeader = req.headers.authorization;
    // only works if suth header is send explictly while making request from server 
    // so we take access token from cookies 

    const token = req.cookies?.accessToken || (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.split(" ")[1] : null);
    if (!token) {
        throw new UnauthorizedError("Authentication Required");
    }

    try {
        const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET);
        req.user = {
            id: decoded.id,
        }

        // attach userID in req.header
        req.headers["x-user-id"] = decoded.id;
        // because req.user is stored in server ram 
        return next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            throw new UnauthorizedError("Token Expired");
        }
        throw new UnauthorizedError("Invalid Token");
    }
}

module.exports = { requireAuth };