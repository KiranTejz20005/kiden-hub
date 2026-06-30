import { describe, it, expect } from 'vitest';
import {
  AppError,
  NotFoundError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  RateLimitError,
  ConflictError,
  formatErrorResponse,
  getErrorMessage,
} from './errors';

describe('AppError', () => {
  it('should create error with correct properties', () => {
    const error = new AppError('Test error', 'TEST_CODE', 400);
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.statusCode).toBe(400);
    expect(error.isOperational).toBe(true);
  });
});

describe('NotFoundError', () => {
  it('should have correct defaults', () => {
    const error = new NotFoundError();
    expect(error.message).toBe('Resource not found');
    expect(error.code).toBe('NOT_FOUND');
    expect(error.statusCode).toBe(404);
  });
});

describe('ValidationError', () => {
  it('should have correct defaults', () => {
    const error = new ValidationError();
    expect(error.message).toBe('Validation failed');
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.statusCode).toBe(400);
  });
});

describe('AuthenticationError', () => {
  it('should have correct defaults', () => {
    const error = new AuthenticationError();
    expect(error.message).toBe('Authentication required');
    expect(error.code).toBe('AUTHENTICATION_ERROR');
    expect(error.statusCode).toBe(401);
  });
});

describe('AuthorizationError', () => {
  it('should have correct defaults', () => {
    const error = new AuthorizationError();
    expect(error.message).toBe('Insufficient permissions');
    expect(error.code).toBe('AUTHORIZATION_ERROR');
    expect(error.statusCode).toBe(403);
  });
});

describe('RateLimitError', () => {
  it('should have correct defaults', () => {
    const error = new RateLimitError();
    expect(error.message).toBe('Too many requests');
    expect(error.code).toBe('RATE_LIMIT_ERROR');
    expect(error.statusCode).toBe(429);
  });
});

describe('ConflictError', () => {
  it('should have correct defaults', () => {
    const error = new ConflictError();
    expect(error.message).toBe('Resource already exists');
    expect(error.code).toBe('CONFLICT_ERROR');
    expect(error.statusCode).toBe(409);
  });
});

describe('formatErrorResponse', () => {
  it('should format AppError correctly', () => {
    const error = new AuthenticationError('Custom message');
    const response = formatErrorResponse(error);
    expect(response.success).toBe(false);
    expect(response.error.code).toBe('AUTHENTICATION_ERROR');
    expect(response.error.message).toBe('Custom message');
  });

  it('should sanitize generic errors', () => {
    const response = formatErrorResponse(new Error('sensitive details'));
    expect(response.success).toBe(false);
    expect(response.error.code).toBe('INTERNAL_ERROR');
    expect(response.error.message).toBe('An unexpected error occurred');
  });

  it('should handle unknown errors', () => {
    const response = formatErrorResponse('some string');
    expect(response.success).toBe(false);
    expect(response.error.code).toBe('INTERNAL_ERROR');
  });
});

describe('getErrorMessage', () => {
  it('should return error message', () => {
    expect(getErrorMessage(new Error('test'))).toBe('test');
  });

  it('should return fallback for non-errors', () => {
    expect(getErrorMessage(null)).toBe('An unexpected error occurred');
  });
});
