require('dotenv').config();

const config = {
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL,
  SERVER_NAME: require("../../package.json").name,
  SERVICE_NAME: require("../../package.json").name,
  PORT: Number(process.env.PORT) || 4001,
  NODE_ENV: process.env.NODE_ENV || "development",
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  DATABASE_URL: process.env.DATABASE_URL || "postgres://admin:irctcpass@localhost:5433/user_service_database",
  REDIS_URL: process.env.REDIS_URL || "redis://:irctcpass@redis:6379",
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || "http://localhost:4000",
  HMAC_SECRET: process.env.HMAC_SECRET || "default_hmac_secret_key_irctc",
  OTP_TTL: Number(process.env.OTP_TTL) || 300,
  OTP_RATE_MAX_PER_HOUR: Number(process.env.OTP_RATE_MAX_PER_HOUR) || 5,
  OTP_ATTEMPT_MAX: Number(process.env.OTP_ATTEMPT_MAX) || 3,
};

module.exports = { config };
