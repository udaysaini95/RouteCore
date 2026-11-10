const logger = require("../config/logger");
const { ServiceUnavailableError } = require("../utils/error");


// 1 implementing circuit breaker class
class CircuitBreaker{
    constructor(serviceName, threshold = config.CIRCUIT_BREAKER_THRESHOLD, timeout = config.CIRCUIT_BREAKER_TIMEOUT)
    {
        this.serviceName = serviceName;
        this.failureCount = 0;
        this.threshold = threshold;
        this.timeout = timeout;
        this.state = "CLOSED"; // closed,open,half-open
        this.nextAttempt = Date.now();   
    }

    async execute(request)
    {
        if (this.state == "OPEN")
        {
            if (Date.now() < this.nextAttempt)
            {
                throw new ServiceUnavailableError(`Service ${this.serviceName} is temporarily Unavailable. Circuit Breaker is Open`)
            }

            // else try to close the circuit
            this.state = "HALF_OPEN";
            logger.info(`Circuit breaker HALF_OPEN for service ${this.serviceName}`);

            try {
                const response = await request();
                this.onSuccess();
                return response;
            } catch (error) {
                this.onFailure();
                throw error;
            }

        }
    }

    async onSuccess()
    {
        this.failureCount = 0;
        if (this.state == "HALF_OPEN")
        {
            this.state = "CLOSED";
            logger.info(`Circuit Breaker closed for service ${this.serviceName}`);
        }
    }
    
    async onFailure()
    {
        this.failureCount++;
        if (this.failureCount >= this.threshold)
        {
            this.state = "OPEN";
            this.nextAttempt = Date.now() + this.timeout;
            logger.info(`Circuit Breaker OPEN for ${this.serviceName}`);
        }
    }

    getState()
    {
        return {
            service: this.serviceName,
            state: this.state,
            failureCount: this.failureCount,
            nextAttempt:this.nextAttempt
        }
    }
}

// circuit breaker for each service
const circuitBreakers = {
    userService : new CircuitBreaker('user-service'),
    bookingService : new CircuitBreaker('booking-service'),
    searchService : new CircuitBreaker('search-service')
}

// 2 Forwarding request to down streamservices



// 3 proxy middleware factory

function createProxy(serviceName,serviceUrl)
{
    const circuitBreaker = circuitBreaker[serviceName];

    if (!circuitBreaker)
    {
        throw new Error(`No Circuit Breaker found for service:${serviceName}`);
    }

    return async (req, res, next) => {
        try {

          // extract path
          // gateway: /api/users/auth/login -> service /auth/login
          // gateway: /api/users/user/profile -> service /user/profile
            logger.info(req.path);
            const pathParts = req.path.split('/').filter(Boolean);
            logger.info(pathParts);

            // remove users (keep the rest)
            // [users,auth,login] -> [auth/login]
            const servicePath = '/' + pathParts.slice(1).join('/');
            logger.info(servicePath);

            const result = await forwardRequest(
              serviceUrl,
                servicePath + (req.url.includes("?") ? req.url.substring(req.url.indexOf("?")) : ""),
                req.method,
                req.body,
                req.headers,
                circuitBreaker
            );

            const excludeHeaders = [
              "connection",
              "keep-alive",
              "transfer-encoding",
              "host",
            ];

            
            
             Object.keys(result.headers).forEach((key) => {
               if (!excludeHeaders.includes(key.toLowerCase())) {
                 res.setHeader(key, result.headers[key]);
               }
             });
            res.status(result.status).json(result.data);

        } catch (error) {
             next(err);
        }
    }
}

function getCircuitBreakerStatus() {
  return Object.values(circuitBreakers).map((cb) => cb.getState());
}

module.exports = {
  createProxy,
  CircuitBreaker,
  circuitBreakers,
  getCircuitBreakerStatus,
};


