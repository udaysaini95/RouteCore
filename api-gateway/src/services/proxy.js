const logger = require("../config/logger");
const { ServiceUnavailableError } = require("../utils/error");


// implementing circuit breaker class
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
const circuitBreaker = {
    userService : new CircuitBreaker('user-service'),
    bookingService : new CircuitBreaker('booking-service'),
    searchService : new CircuitBreaker('search-service')
}
