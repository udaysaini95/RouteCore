const { ConflictError, BadRequestError, UnauthorizedError, ForbiddenError } = require("../utils/error");
const bcrypt = require('bcrypt');
const prisma = require('../config/prisma.js');
const { generateAndStoreOtp, verifyOtp: verifyOtpInRedis } = require('../utils/otp.js');
const { sendOtpEmail, verifyOtpEmail } = require('../utils/email.js');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require("../utils/auth.js");
const { config } = require("../config");
const jwt = require('jsonwebtoken');
const { redis } = require("../config/redis.js");
const logger = require("../config/logger");

const sendOTP = async (firstName, lastName, email, password) => {
    const existingUser = await prisma.user.findUnique({
        where: { email }
    });

    if (existingUser) {
        throw new ConflictError("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const meta = { firstName, lastName, email, hashedPassword };

    const { otp, otpSessionId } = await generateAndStoreOtp(meta);
    await sendOtpEmail(email, otp);
    return { otpSessionId };
};

const verifyOTP = async (otp, otpSessionId) => {
    const meta = await verifyOtpInRedis(otp, otpSessionId);
    if (!meta) {
        throw new BadRequestError("Invalid or expired OTP", "OTP_INVALID");
    }

    const user = await prisma.user.create({
        data: {
            firstName: meta.firstName,
            lastName: meta.lastName,
            email: meta.email,
            password: meta.hashedPassword,
            emailVerified: true,
        },
    });

    await verifyOtpEmail(meta);
    logger.info(`Welcome email sent for ${meta.email}`);
    return user;
};

const login = async (email, password, deviceId) => {
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (!existingUser) {
        throw new UnauthorizedError(
            "Invalid email or password",
            "INVALID_CREDENTIALS"
        );
    }

    if (!existingUser.password) {
        throw new BadRequestError(
            "This account was created with Google. Please sign in with Google.",
            "OAUTH_ONLY_ACCOUNT"
        );
    }

    const doesPasswordMatch = await bcrypt.compare(
        password,
        existingUser.password
    );

    if (!doesPasswordMatch) {
        throw new UnauthorizedError(
            "Invalid email or password",
            "INVALID_CREDENTIALS"
        );
    }

    const accessToken = generateAccessToken(existingUser.id);
    const refreshToken = generateRefreshToken(existingUser.id);
    const { jti } = jwt.decode(refreshToken);

    await redis.set(
        `refresh:${existingUser.id}:${deviceId}`,
        jti,
        "EX",
        config.REFRESH_TOKEN_EXP_SEC
    );

    const { password: _password, ...safeUser } = existingUser;
    await redis.set(
        `user:${existingUser.id}`,
        JSON.stringify(safeUser),
        "EX",
        config.REDIS_USER_TTL
    );

    return { accessToken, refreshToken, loggedInUser: safeUser };
};

const rotateRefreshToken = async (refreshToken, deviceId) => {
    let payload;
    try {
        payload = verifyRefreshToken(refreshToken);
    } catch (err) {
        throw new UnauthorizedError("Invalid or expired refresh token", "INVALID_TOKEN");
    }

    const { id: userId, jti } = payload;
    const storedJti = await redis.get(`refresh:${userId}:${deviceId}`);

    if (!storedJti) {
        throw new ForbiddenError("Session Expired", "Login AGAIN");
    }

    if (storedJti !== jti) {
        await redis.del(`refresh:${userId}:${deviceId}`);
        throw new ForbiddenError("Refresh token reused", "LOGIN AGAIN");
    }

    const newAccessToken = generateAccessToken(payload.id);
    const newRefreshToken = generateRefreshToken(payload.id);
    const { jti: newJti } = jwt.decode(newRefreshToken);

    await redis.set(
        `refresh:${payload.id}:${deviceId}`,
        newJti,
        "EX",
        config.REFRESH_TOKEN_EXP_SEC
    );

    return { newAccessToken, newRefreshToken };
};

module.exports = {
    sendOTP,
    verifyOTP,
    verifyOtp: verifyOTP,
    rotateRefreshToken,
    login
};
