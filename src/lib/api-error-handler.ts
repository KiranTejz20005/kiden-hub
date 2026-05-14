/**
 * API Error Handling and Recovery Utilities
 * Provides comprehensive error classification and recovery strategies
 */

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ErrorCategory = 'network' | 'auth' | 'validation' | 'conflict' | 'ratelimit' | 'server' | 'unknown';

export interface ApiError {
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  statusCode?: number;
  isRetryable: boolean;
  originalError: any;
}

/**
 * Classify API errors and determine recovery strategy
 */
export function classifyApiError(error: any): ApiError {
  // Check for network errors (no response)
  if (!error.response) {
    return {
      category: 'network',
      severity: 'high',
      message: 'Network error - check your connection',
      isRetryable: true,
      originalError: error
    };
  }

  const status = error.response.status;
  const data = error.response.data;

  // 4xx errors (client errors)
  if (status >= 400 && status < 500) {
    if (status === 401) {
      return {
        category: 'auth',
        severity: 'high',
        message: 'Authentication failed - please log in again',
        statusCode: status,
        isRetryable: false,
        originalError: error
      };
    }

    if (status === 403) {
      return {
        category: 'auth',
        severity: 'medium',
        message: 'Permission denied - you do not have access to this resource',
        statusCode: status,
        isRetryable: false,
        originalError: error
      };
    }

    if (status === 404) {
      return {
        category: 'validation',
        severity: 'medium',
        message: 'Resource not found',
        statusCode: status,
        isRetryable: false,
        originalError: error
      };
    }

    if (status === 409) {
      return {
        category: 'conflict',
        severity: 'medium',
        message: data?.message || 'Resource conflict - the resource may have been modified',
        statusCode: status,
        isRetryable: false,
        originalError: error
      };
    }

    if (status === 429) {
      return {
        category: 'ratelimit',
        severity: 'medium',
        message: 'Too many requests - please wait before trying again',
        statusCode: status,
        isRetryable: true,
        originalError: error
      };
    }

    // Generic 4xx validation error
    return {
      category: 'validation',
      severity: 'low',
      message: data?.message || 'Invalid request',
      statusCode: status,
      isRetryable: false,
      originalError: error
    };
  }

  // 5xx errors (server errors)
  if (status >= 500) {
    return {
      category: 'server',
      severity: status === 500 ? 'high' : 'medium',
      message: 'Server error - the service is temporarily unavailable',
      statusCode: status,
      isRetryable: true,
      originalError: error
    };
  }

  // Unknown error
  return {
    category: 'unknown',
    severity: 'medium',
    message: error.message || 'An unexpected error occurred',
    statusCode: status,
    isRetryable: true,
    originalError: error
  };
}

/**
 * Get user-friendly error message based on error type
 */
export function getUserFriendlyMessage(error: ApiError): string {
  const messages: Record<ErrorCategory, string> = {
    network: '⚠️ Network error. Check your connection and try again.',
    auth: '🔐 You need to log in to perform this action.',
    validation: '❌ Invalid input. Please check your request and try again.',
    conflict: '⚡ This resource was modified. Please refresh and try again.',
    ratelimit: '⏱️ Too many requests. Please wait a moment and try again.',
    server: '🔧 The service is temporarily unavailable. Please try again later.',
    unknown: '❓ Something went wrong. Please try again.'
  };

  return messages[error.category];
}

/**
 * Get suggested recovery action for error
 */
export function getSuggestedAction(error: ApiError): 'retry' | 'refresh' | 'login' | 'contact-support' | 'none' {
  switch (error.category) {
    case 'network':
    case 'ratelimit':
      return 'retry';
    case 'auth':
      return 'login';
    case 'server':
      return 'refresh';
    case 'conflict':
      return 'refresh';
    case 'validation':
    case 'unknown':
    default:
      return 'contact-support';
  }
}

/**
 * Safe API call wrapper with error handling
 */
export async function safeApiCall<T>(
  fn: () => Promise<T>,
  context?: string
): Promise<{ data: T | null; error: ApiError | null }> {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (error) {
    const apiError = classifyApiError(error);
    console.error(`[${context || 'API'}] Error:`, apiError);
    return { data: null, error: apiError };
  }
}

/**
 * Create error recovery handler
 */
export function createErrorRecoveryHandler(
  onError: (error: ApiError, action: string) => void
) {
  return (error: ApiError) => {
    const action = getSuggestedAction(error);
    const message = getUserFriendlyMessage(error);
    onError(error, message);
    
    // Auto-handle certain actions
    switch (action) {
      case 'retry':
        // Caller should implement retry logic
        break;
      case 'login':
        // Redirect to login
        window.location.href = '/sign-in';
        break;
      case 'refresh':
        // Auto-refresh page after delay
        setTimeout(() => window.location.reload(), 2000);
        break;
      default:
        // Show error to user
        break;
    }
  };
}

/**
 * Batch error handler for parallel operations
 */
export function handleBatchErrors(
  results: Array<{ data: any | null; error: ApiError | null }>
): { successful: number; failed: number; criticalErrors: ApiError[] } {
  const criticalErrors = results
    .filter(r => r.error && r.error.severity === 'critical')
    .map(r => r.error as ApiError);

  const successful = results.filter(r => r.data !== null).length;
  const failed = results.filter(r => r.error !== null).length;

  return {
    successful,
    failed,
    criticalErrors
  };
}

/**
 * Fallback data provider for errors
 */
export function getFallbackData<T>(defaultValue: T, category: ErrorCategory): T {
  // Return sensible defaults based on error type
  if (category === 'network') {
    return defaultValue; // Use last known good value
  }
  if (category === 'auth') {
    return {} as T; // Return empty
  }
  return defaultValue;
}
