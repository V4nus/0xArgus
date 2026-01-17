/**
 * Centralized Error Handling
 *
 * Provides:
 * - Custom error classes
 * - Error logging utilities
 * - API error response helpers
 */

import { NextResponse } from 'next/server';

// ============ Custom Error Classes ============

/**
 * Base class for application errors
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode = 500,
    code = 'INTERNAL_ERROR',
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.context = context;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace?.(this, this.constructor);
  }
}

/**
 * Validation error (400)
 */
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 400, 'VALIDATION_ERROR', context);
    this.name = 'ValidationError';
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} not found: ${identifier}`
      : `${resource} not found`;
    super(message, 404, 'NOT_FOUND', { resource, identifier });
    this.name = 'NotFoundError';
  }
}

/**
 * Rate limit error (429)
 */
export class RateLimitError extends AppError {
  public readonly retryAfter?: number;

  constructor(message = 'Too many requests', retryAfter?: number) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', { retryAfter });
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * External service error (502/503)
 */
export class ExternalServiceError extends AppError {
  public readonly service: string;

  constructor(service: string, originalError?: Error) {
    super(
      `External service error: ${service}`,
      502,
      'EXTERNAL_SERVICE_ERROR',
      {
        service,
        originalMessage: originalError?.message,
      }
    );
    this.name = 'ExternalServiceError';
    this.service = service;

    if (originalError?.stack) {
      this.stack = `${this.stack}\nCaused by: ${originalError.stack}`;
    }
  }
}

/**
 * RPC error (specific to blockchain calls)
 */
export class RPCError extends ExternalServiceError {
  public readonly rpcUrl?: string;

  constructor(chainId: string, originalError?: Error, rpcUrl?: string) {
    super(`RPC:${chainId}`, originalError);
    this.name = 'RPCError';
    this.rpcUrl = rpcUrl;
  }
}

// ============ Error Logging ============

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

/**
 * Structured error logger
 */
export function logError(
  source: string,
  message: string,
  error?: Error | unknown,
  context?: LogContext
): void {
  const timestamp = new Date().toISOString();
  const errorDetails = error instanceof Error
    ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...(error instanceof AppError ? { code: error.code, context: error.context } : {}),
      }
    : error;

  console.error(JSON.stringify({
    timestamp,
    level: 'error',
    source,
    message,
    error: errorDetails,
    context,
  }, null, process.env.NODE_ENV === 'development' ? 2 : 0));
}

/**
 * Warning logger
 */
export function logWarn(
  source: string,
  message: string,
  context?: LogContext
): void {
  const timestamp = new Date().toISOString();

  console.warn(JSON.stringify({
    timestamp,
    level: 'warn',
    source,
    message,
    context,
  }, null, process.env.NODE_ENV === 'development' ? 2 : 0));
}

/**
 * Info logger
 */
export function logInfo(
  source: string,
  message: string,
  context?: LogContext
): void {
  if (process.env.NODE_ENV === 'development') {
    const timestamp = new Date().toISOString();

    console.log(JSON.stringify({
      timestamp,
      level: 'info',
      source,
      message,
      context,
    }, null, 2));
  }
}

// ============ API Response Helpers ============

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

/**
 * Create a standardized error response
 */
export function errorResponse(
  error: Error | AppError | unknown,
  defaultMessage = 'An error occurred'
): NextResponse<ApiErrorResponse> {
  // Handle known application errors
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        details: process.env.NODE_ENV === 'development' ? error.context : undefined,
      },
      { status: error.statusCode }
    );
  }

  // Handle rate limit errors with retry header
  if (error instanceof RateLimitError && error.retryAfter) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
      },
      {
        status: 429,
        headers: { 'Retry-After': String(error.retryAfter) },
      }
    );
  }

  // Handle generic errors
  const message = error instanceof Error ? error.message : defaultMessage;

  return NextResponse.json(
    {
      success: false,
      error: process.env.NODE_ENV === 'development' ? message : defaultMessage,
      code: 'INTERNAL_ERROR',
    },
    { status: 500 }
  );
}

/**
 * Wrap an async API handler with error handling
 */
export function withErrorHandling<T>(
  handler: () => Promise<NextResponse<T>>,
  source: string
): Promise<NextResponse<T | ApiErrorResponse>> {
  return handler().catch((error) => {
    logError(source, 'Unhandled error in API handler', error);
    return errorResponse(error);
  });
}

// ============ Error Utilities ============

/**
 * Safely execute a function, returning null on error
 */
export async function safeExecute<T>(
  fn: () => Promise<T>,
  fallback: T | null = null,
  onError?: (error: Error) => void
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    if (onError && error instanceof Error) {
      onError(error);
    }
    return fallback;
  }
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    onRetry?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  const { maxRetries = 3, initialDelay = 1000, maxDelay = 10000, onRetry } = options;
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
        onRetry?.(lastError, attempt + 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}
