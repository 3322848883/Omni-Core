// Custom Error Classes

export class AppError extends Error {
  public statusCode: number;
  public code: string;

  constructor(
    messageOrCode: string,
    statusCodeOrMessage: number | string = 500,
    codeOrStatus?: string | number
  ) {
    let message: string;
    let statusCode: number;
    let code: string;

    if (typeof statusCodeOrMessage === 'string') {
      message = statusCodeOrMessage;
      statusCode = typeof codeOrStatus === 'number' ? codeOrStatus : 500;
      code = messageOrCode;
    } else {
      message = messageOrCode;
      statusCode = statusCodeOrMessage;
      code = typeof codeOrStatus === 'string' ? codeOrStatus : 'INTERNAL_ERROR';
    }

    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', id?: string) {
    const message = id 
      ? `${resource} not found: ${id}` 
      : `${resource} not found`;
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  public errors?: Array<{ field: string; message: string }>;

  constructor(
    messageOrErrors: string | Array<{ field: string; message: string }>,
    errors?: Array<{ field: string; message: string }>
  ) {
    const message = typeof messageOrErrors === 'string' 
      ? messageOrErrors 
      : 'Validation failed';
    const errorsArray = typeof messageOrErrors === 'string' 
      ? errors 
      : messageOrErrors;
    super(message, 422, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.errors = errorsArray;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict') {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request') {
    super(message, 400, 'BAD_REQUEST');
    this.name = 'BadRequestError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMITED');
    this.name = 'RateLimitError';
  }
}

export class TokenExpiredError extends AppError {
  constructor(message: string = 'Token expired') {
    super(message, 401, 'TOKEN_EXPIRED');
    this.name = 'TokenExpiredError';
  }
}
