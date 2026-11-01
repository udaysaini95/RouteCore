const { ConflictError, BadRequestError } = require("../utils/error");
const bcrypt = require('bcrypt');
const prisma = require('../config/prisma.js');
const { generateAndStoreOtp, verifyOtp: verifyOtpInRedis } = require('../utils/otp.js');
const { sendOtpEmail, verifyOtpEmail } = require('../utils/email.js');
const { generateAccesToken, generateRefreshToken } = require("../utils/auth.js");
const { config } = require("winston");

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

const verifyOtp = async (otp, otpSessionId) => {
    const meta = await verifyOtpInRedis(otp, otpSessionId);
    if (!meta) {
        throw new BadRequestError("Invalid or Expired OTP", "OTP_INVALID");
    }

    const user = await prisma.user.create({
        data: {
            firstName: meta.firstName,
            lastName: meta.lastName,
            email: meta.email,
            password: meta.hashedPassword,
            emailVerified: true
        }
    });

    await verifyOtpEmail(meta);
    return user;
};

const login = async(email, password, deviceId)=>
{
    const existingUser = await prisma.user.findUnique({
        where: { email }
    })

    if (existingUser)
    {
        throw new BadRequestError("Email not found")
    }

    const doesPasswordmatch = await bcrypt.compare(password, existingUser.password);

    if (!doesPasswordmatch)
    {
        throw new BadRequestError("Wrong Password")
    }

    const acccesToken = generateAccesToken(existingUser.id);
    const refreshToken = generateRefreshToken(existingUser.id);

    const { jti } = jwt.decode(refreshToken);
    await redis.set(
      `refresh:${existingUser.id}:${deviceId}`,
      jti,
      "EX",
      REFRESH_TOKEN_EXP_SEC,
    );

    const { password: _password, ...safeUser } = { existingUser };
    await redis.set(`user:${existingUser.id}`, JSON.stringify(safeUser), EX, config.REDIS_USER_TTL);

    return {acccesToken,refreshToken,loggedInUser:safeUser}
}



module.exports = { sendOTP, verifyOtp,login };
