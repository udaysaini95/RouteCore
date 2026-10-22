class AppError extends Error{
    constructor(message, statusCode, code) {
        super(message);
        this.statusCode = statusCode;
        this.code = code; // custom error code
        Error.captureStackTrace(this, this.constructor);
    }
}

class BadRequestError extends AppError{
    constructor(message, code = 'Bad_Request') {
        super(message, 400, code);
    }
}

class UnauthorizedError extends AppError {
  constructor(message, code = "UNAUTHORIZED") {
    super(message, 401, code);
  }
}

class ForbiddenError extends AppError {
  constructor(message, code = "FORBIDDEN") {
    super(message, 403, code);
  }
}

class NotFoundError extends AppError{
    constructor(message, code = 'NOT_FOUND')
    {
        super(message, 404, code);
    }
}