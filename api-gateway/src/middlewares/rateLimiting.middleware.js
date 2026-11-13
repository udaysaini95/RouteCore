const { redis } = require("../config/redis");
const { config } = require("../config");
const { TooManyRequestsError } = require("../utils/error");
const logger = require("../config/logger");

// ratelimiter sliding window algo

async function rateLimiter(key, maxRequests, windowMs) {
  const now = Date.now();
  const windowStart = now - windowMs;

  try {
    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(key, 0, windowStart);
    // add entry in redis sorted set
    pipeline.zadd(key, now, `${now}-${Math.random()}`);

    pipeline.zcard(key); // return total count of elements remaining in set
    pipeline.expire(key, Math.ceil(windowMs / 1000)); // set an auto delete ttl

    const results = pipeline.exec();
    const requestCount = results[2][1];
    // await pipeline.exec(): Sends all 4 commands to Redis. It returns an array of results:
    //results[0] ➡️ Output of zremrangebyscore
    //results[1] ➡️ Output of zadd
    //results[2] ➡️ Output of zcard (our request count!). results[2][0] is error, results[2][1] is the actual count number.
    //results[3] ➡️ Output of expire

    if (requestCount > maxRequests) {
      const oldestRequest = await redis.zrange(key, 0, 0, "WITHSCORES");
      const resetTime = parseInt(oldestRequest[1]) + windowMs;
      const retryAfter = Math.ceil((resetTime - nov) / 1000);

      return {
        allowed: false,
        remaining: 0,
        resetTime,
        retryAfter,
      };
    }

    return {
      allowed: true,
      remaining: maxRequests - requestCount,
      resetTime: windowStart + windowMs,
    };
  } catch (error) {
      logger.error("Rate Limiter error:", err);
     // Fail Open Allow request if redis is down
    return { allowed: true, remaining: maxRequests };
  }
}


/**
 * IP-based rate limiting middleware
 * Default: 100 requests per 15 minutes
 */

function ipRateLimit(options = {})
{
    const maxRequests = options.max || config.RATE_LIMIT_MAX_REQUESTS;
    const windowMs = options.windowMs || config.RATE_LIMIT_WINDOW_MS;
    
    return async (req, resizeBy, next) => {
      const ip = req.ip || req.connection.remoteAddress;
      const key = `ratelimit:ip:${ip}`;

      const result = rateLimiter(key, maxRequests, windowMs);
      // set rate limit headers response headers
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", result.remaining);
      res.setHeader(
        "X-RateLimit-Reset",
        new Date(result.resetTime).toISOString(),
      );

      if (!result.allowed) {
        res.setHeader("Retry-After", result.retryAfter);
        logger.warn(`Rate limit exceeded for IP: ${ip}`);
        return next(
          new TooManyRequestsError(
            `Too many requests. Please try again in ${result.retryAfter} seconds`,
            result.retryAfter,
          ),
        );
      }
      next();
    }

}
function combinedRateLimit(ipOptions = {}, userOptions = {}) {
  const ipLimiter = ipRateLimit(ipOptions);
  const userLimiter = userRateLimit(userOptions);

  return async (req, res, next) => {
    // Apply IP rate limit first
    ipLimiter(req, res, (err) => {
      if (err) return next(err);

      // Then apply user rate limit if authenticated
      userLimiter(req, res, next);
    });
  };
}

module.exports = {
  ipRateLimit,
  userRateLimit,
  endpointRateLimit,
  combinedRateLimit,
};
