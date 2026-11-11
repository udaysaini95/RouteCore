require("dotenv").config();

const config = {
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL,
  SERVER_NAME: require("../../package.json").name,
  SERVICE_NAME: require("../../package.json").name,
  REDIS_USER_TTL: Number(process.env.REDIS_USER_TTL || 86400),
  JWT_ACCESS_SECRET:
    process.env.JWT_ACCESS_SECRET ||
    "0f8bf908f8d38527c188c93bda49d48bd421a43fa0bdf3e77de1f0db785e6f37",
  JWT_REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET ||
    "826d2c0edb5ad8f8ac7668556c034ea228931a49576aefccc80d6f469cc4a34c4da82ca43a5c43de91ffdad2f4644c655e2eb3ccbb8bc2848cb64fe7ea2a1ab9",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  ACCESS_TOKEN_EXP: process.env.ACCESS_TOKEN_EXP || "15m",
  REFRESH_TOKEN_EXP: process.env.REFRESH_TOKEN_EXP || "7d",

  KAFKA_BROKER: process.env.KAFKA_BROKER,
  KAFKA_CLIENT_ID: process.env.KAFKA_CLIENT_ID,

  ACCESS_TOKEN_EXP_SEC: Number(process.env.ACCESS_TOKEN_EXP_SEC || 900),
  REFRESH_TOKEN_EXP_SEC: Number(process.env.REFRESH_TOKEN_EXP_SEC || 604800),

  PORT: Number(process.env.PORT) || 4000,
  NODE_ENV: process.env.NODE_ENV || "development",
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  DATABASE_URL:
    process.env.DATABASE_URL ||
    "postgres://admin:irctcpass@localhost:5433/user_service_database",
  REDIS_URL: process.env.REDIS_URL || "redis://:irctcpass@redis:6379",
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || "http://localhost:4000",
  HMAC_SECRET: process.env.HMAC_SECRET || "default_hmac_secret_key_irctc",
  OTP_TTL: Number(process.env.OTP_TTL) || 300,
  OTP_RATE_MAX_PER_HOUR: Number(process.env.OTP_RATE_MAX_PER_HOUR) || 5,
  OTP_ATTEMPT_MAX: Number(process.env.OTP_ATTEMPT_MAX) || 3,

  SERVICES: {
    USER_SERVICE_URL: process.env.USER_SERVICE_URL || "http://localhost:4001",
    BOOKING_SERVICE_URL:
      process.env.BOOKING_SERVICE_URL || "http://localhost:4002",
  },

  CIRCUIT_BREAKER_THRESHOLD: Number(process.env.CIRCUIT_BREAKER_THRESHOLD || 5),
  CIRCUIT_BREAKER_TIMEOUT: Number(process.env.CIRCUIT_BREAKER_TIMEOUT || 30000), // 30 seconds
  SERVICE_TIMEOUT_MS: Number(process.env.SERVICE_TIMEOUT_MS || 5000), // 5 seconds
};




module.exports = { config };
