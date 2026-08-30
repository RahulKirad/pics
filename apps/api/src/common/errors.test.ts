import { describe, it, expect } from 'vitest';
import { AppError, ValidationError, NotFoundError } from './errors.js';

describe('AppError', () => {
  it('creates error with code and status', () => {
    const err = new AppError('TEST', 'Test message', 418);
    expect(err.code).toBe('TEST');
    expect(err.message).toBe('Test message');
    expect(err.statusCode).toBe(418);
  });
});

describe('ValidationError', () => {
  it('defaults to 400', () => {
    const err = new ValidationError('Invalid input');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
  });
});

describe('NotFoundError', () => {
  it('defaults to 404', () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
  });
});
