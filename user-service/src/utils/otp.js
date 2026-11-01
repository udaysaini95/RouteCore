const { TooManyRequestsError } = require("./error");
const { config } = require("../config/index.js");
const crypto = require('crypto');
const otpGenerator = require('otp-generator');
const { redis } = require('../config/redis.js');

const RATE_MAX = parseInt(config.OTP_RATE_MAX_PER_HOUR || '5', 10);
const ATTEMPT_MAX = parseInt(config.OTP_ATTEMPT_MAX || '3', 10);
const HMAC_SECRET = config.HMAC_SECRET;
const OTP_TTL = parseInt(config.OTP_TTL || '300', 10);

function hmacFor(email, otp) {
    return crypto.createHmac('sha256', HMAC_SECRET).update(`${email}:${otp}`).digest('hex');
}

async function generateAndStoreOtp(meta) {
    // how many otps you can send in an hour
    const rateKey = `otp:rate:${meta.email}`;
    const sentCount = parseInt(await redis.get(rateKey) || '0', 10);

    if (sentCount >= RATE_MAX) {
        throw new TooManyRequestsError("Too Many otp requests");
    }

    const otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false
    });

    const otpSessionId = crypto.randomUUID();
    const hashed = hmacFor(meta.email, otp);

    await redis.set(`otp:session:${otpSessionId}`, JSON.stringify({
        hashedOtp: hashed,
        meta
    }), 'EX', OTP_TTL);

    const newCount = await redis.incr(rateKey);
    if (newCount == 1) {
        await redis.expire(rateKey, 3600);
    }
    return { otp, otpSessionId };
}

async function verifyOtp(otp, otpSessionId) {
    if (!otp || !otpSessionId) {
        return null;
    }

    const rawData = await redis.get(`otp:session:${otpSessionId}`);
    if (!rawData) return null;

    const { hashedOtp: storedOtp, meta } = JSON.parse(rawData);

    const attemptsKey = `otp:attempts:${meta.email}`;
    const attemptsCount = parseInt(await redis.get(attemptsKey) || '0', 10);

    if (attemptsCount >= ATTEMPT_MAX) {
        throw new TooManyRequestsError("Too many attempts to verify OTP");
    }

    const hashedOtp = hmacFor(meta.email, otp);
    const hashedBuffer = Buffer.from(hashedOtp, 'hex');
    const storedBuffer = Buffer.from(storedOtp, 'hex');

    if (hashedBuffer.length === storedBuffer.length && crypto.timingSafeEqual(hashedBuffer, storedBuffer)) {
        await redis.del(`otp:session:${otpSessionId}`, attemptsKey);
        await redis.del(`otp:rate:${meta.email}`);
        return meta;
    } else {
        await redis.incr(attemptsKey);
        await redis.expire(attemptsKey, OTP_TTL);
        return null;
    }
}

module.exports = { generateAndStoreOtp, verifyOtp };
