/**
 * API Retry Utility with Exponential Backoff
 *
 * Handles temporary failures during high concurrency scenarios
 * - Implements exponential backoff for rate limits and server errors
 * - Configurable retry attempts and delays
 * - Production-ready error handling
 */

interface RetryConfig {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableStatusCodes?: number[];
}

const DEFAULT_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504], // Request timeout, rate limit, server errors
};

/**
 * Sleep utility for delays
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate exponential backoff delay with jitter
 * Jitter prevents thundering herd problem when many clients retry simultaneously
 */
function calculateDelay(attempt: number, config: Required<RetryConfig>): number {
  const exponentialDelay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt);
  const cappedDelay = Math.min(exponentialDelay, config.maxDelay);
  // Add jitter: randomize ±25% of delay
  const jitter = cappedDelay * 0.25 * (Math.random() * 2 - 1);
  return Math.floor(cappedDelay + jitter);
}

/**
 * Fetch with automatic retry and exponential backoff
 *
 * @example
 * ```ts
 * const response = await fetchWithRetry('/api/auth/register', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify(data),
 * }, {
 *   maxRetries: 3,
 *   initialDelay: 1000,
 * });
 * ```
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryConfig: RetryConfig = {}
): Promise<Response> {
  const config = { ...DEFAULT_CONFIG, ...retryConfig };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // If successful or non-retryable error, return immediately
      if (response.ok || !config.retryableStatusCodes.includes(response.status)) {
        return response;
      }

      // Check if this is the last attempt
      if (attempt === config.maxRetries) {
        return response; // Return the failed response on last attempt
      }

      // Calculate backoff delay
      const delay = calculateDelay(attempt, config);

      // If rate limited, respect Retry-After header
      const retryAfter = response.headers.get('Retry-After');
      const retryDelay = retryAfter
        ? parseInt(retryAfter) * 1000
        : delay;

      // Wait before retrying
      await sleep(retryDelay);

    } catch (error) {
      lastError = error as Error;

      // If this is the last attempt, throw the error
      if (attempt === config.maxRetries) {
        throw lastError;
      }

      // Wait before retrying (network errors)
      const delay = calculateDelay(attempt, config);
      await sleep(delay);
    }
  }

  // Should never reach here, but TypeScript requires it
  throw lastError || new Error('Max retries exceeded');
}

/**
 * JSON-specific retry wrapper
 * Automatically parses JSON and handles common errors
 */
export async function fetchJsonWithRetry<T = any>(
  url: string,
  options: RequestInit = {},
  retryConfig: RetryConfig = {}
): Promise<{ data: T; response: Response }> {
  const response = await fetchWithRetry(url, options, retryConfig);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return { data, response };
}
