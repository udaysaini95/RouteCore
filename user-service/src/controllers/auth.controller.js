const { config } = require("../config/index.js");
const asyncHandler = require("../utils/asyncHandler.js");
const { BadRequestError } = require("../utils/error.js");
const authService = require('../services/auth.service.js');
const getDeviceFingerprint = require("../utils/deviceFingerprint.js");

exports.sendOTP = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, password, confirmPassword } = req.body || {};
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
        throw new BadRequestError("All fields are mandatory");
    }

    if (password !== confirmPassword) {
        throw new BadRequestError("Password doesnt match");
    }

    const { otpSessionId } = await authService.sendOTP(firstName, lastName, email, password);
    res.cookie("otp_session", otpSessionId, {
        httpOnly: true,
        secure: config.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: config.OTP_TTL * 1000
    }).status(200).json({
        success: true,
        message: "OTP sent successfully"
    });
});

exports.verifyOtp = asyncHandler(async (req, res) => {
    const { otp } = req.body;
    const otpSessionId = req.cookies.otp_session;

    if (!otp || !otpSessionId) {
        throw new BadRequestError("Otp or Otp session is missing");
    }

    const user = await authService.verifyOtp(otp, otpSessionId);

    const { password, ...safeUser } = user;
    res.clearCookie("otp_session");

    return res.status(201).json({
        success: true,
        message: "User Account created successfully",
        data: safeUser
    });
});

exports.login = asyncHandler((req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
    {
        return new BadRequestError("Incomplete Information")
    }

    const deviceId = getDeviceFingerprint(req);
    
    const { accessToken, refreshToken, loggedInUser } = authService.login(email, password, deviceId);
    
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: config.ACCESS_TOKEN_EXP_SEC * 1000
    })

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge:config.REFRESH_TOKEN_EXP_SEC*1000
    }).status(200).json({
        success: true,
        message: "Logged in successfully",
        loggedInUser
    })
})
