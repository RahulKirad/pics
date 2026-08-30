export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 500,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, code = 'VALIDATION_ERROR') {
    super(code, message, 400);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    super(code, message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', code = 'FORBIDDEN') {
    super(code, message, 403);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code = 'NOT_FOUND') {
    super(code, message, 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code = 'CONFLICT') {
    super(code, message, 409);
    this.name = 'ConflictError';
  }
}

export class QuotaExceededError extends AppError {
  constructor(message: string, code = 'QUOTA_EXCEEDED') {
    super(code, message, 429);
    this.name = 'QuotaExceededError';
  }
}

export class StorageError extends AppError {
  constructor(message: string, code = 'STORAGE_ERROR') {
    super(code, message, 500);
    this.name = 'StorageError';
  }
}

export class ProcessingError extends AppError {
  constructor(message: string, code = 'PROCESSING_ERROR') {
    super(code, message, 500);
    this.name = 'ProcessingError';
  }
}
