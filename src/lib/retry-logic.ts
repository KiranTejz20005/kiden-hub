/**
 * Retry Logic with Exponential Backoff
 * Handles transient failures in API calls with intelligent retry strategies
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: any) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  shouldRetry: (error) => {
    // Retry on network errors and specific HTTP status codes
    if (!error.response) return true; // Network error
    const status = error.response.status;
    return status === 429 || // Too many requests
           status === 503 || // Service unavailable
           status === 504;   // Gateway timeout
  }
};

/**
 * Execute a function with exponential backoff retry logic
 * @param fn Async function to execute
 * @param options Retry configuration
 * @returns Result of the function call
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;
  let delay = opts.initialDelay;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry if we've exhausted attempts
      if (attempt === opts.maxRetries) break;
      
      // Check if this error is retryable
      if (!opts.shouldRetry(error)) break;

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Calculate next delay (exponential backoff with jitter)
      const jitter = Math.random() * 0.1 * delay;
      delay = Math.min(
        opts.maxDelay,
        Math.floor(delay * opts.backoffMultiplier + jitter)
      );
    }
  }

  throw lastError;
}

/**
 * Batch multiple async operations with controlled concurrency
 * @param items Items to process
 * @param fn Async function to apply to each item
 * @param concurrency Maximum concurrent operations
 * @returns Array of results
 */
export async function batchWithConcurrency<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency: number = 5
): Promise<R[]> {
  const results: R[] = [];
  const executing: Promise<void>[] = [];

  for (const item of items) {
    const promise = Promise.resolve().then(() => fn(item)).then(result => {
      results.push(result);
    });

    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      executing.splice(executing.findIndex(p => p === promise), 1);
    }
  }

  await Promise.all(executing);
  return results;
}

/**
 * Circuit breaker for failed API calls
 * Prevents cascading failures by stopping requests after threshold
 */
export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private failureThreshold = 5,
    private resetTimeout = 60000 // 1 minute
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN - service temporarily unavailable');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  reset() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
}

/**
 * Request deduplication to prevent duplicate simultaneous requests
 */
export class RequestDeduplicator {
  private pending: Map<string, Promise<any>> = new Map();

  async deduplicate<T>(
    key: string,
    fn: () => Promise<T>
  ): Promise<T> {
    // Return existing pending request if it exists
    if (this.pending.has(key)) {
      return this.pending.get(key) as Promise<T>;
    }

    // Create and store new request
    const promise = fn()
      .finally(() => {
        // Clean up after request completes
        this.pending.delete(key);
      });

    this.pending.set(key, promise);
    return promise;
  }

  clear() {
    this.pending.clear();
  }
}

/**
 * Timeout wrapper for promises
 * @param promise Promise to wrap
 * @param timeoutMs Timeout duration in milliseconds
 * @param message Error message
 * @returns Promise that rejects if timeout is exceeded
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(message)), timeoutMs)
    )
  ]);
}

/**
 * Utility to create a reusable circuit breaker instance
 */
export const createCircuitBreaker = (threshold = 5, resetTimeout = 60000) =>
  new CircuitBreaker(threshold, resetTimeout);

/**
 * Utility to create a reusable request deduplicator instance
 */
export const createRequestDeduplicator = () =>
  new RequestDeduplicator();
