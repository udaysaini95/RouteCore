


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
            const oldestRequest = await redis.zrange(key, 0, 0, 'WITHSCORES');
            const resetTime = parseInt(oldestRequest[1]) + windowMs;
            const retryAfter = Math.ceil((resetTime - nov) / 1000);

            return {
                allowed: false,
                remaining: 0,
                resetTime,
                retryTime,
            };
        }

        return {
            allowed: true,
            remaining: maxRequests - requestCount,
            resetTime: windowStart + windowMs,
        }

    } catch (error) {
        logger.error('Rate Limiter error:', err);
        return { allowed: true, remaining: maxRequests };
    }

}