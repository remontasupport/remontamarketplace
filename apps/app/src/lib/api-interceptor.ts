/**
 * API Interceptor
 *
 * Intercepts fetch calls to show/hide progress bar
 */

type ProgressCallbacks = {
  onStart: () => void;
  onComplete: () => void;
};

let progressCallbacks: ProgressCallbacks | null = null;
let activeRequests = 0;

export function setupApiInterceptor(callbacks: ProgressCallbacks) {
  progressCallbacks = callbacks;

  // Store the original fetch
  const originalFetch = window.fetch;

  // Override fetch
  window.fetch = async (...args) => {
    // Start progress if first request
    if (activeRequests === 0 && progressCallbacks) {
      progressCallbacks.onStart();
    }

    activeRequests++;

    try {
      const response = await originalFetch(...args);
      return response;
    } finally {
      activeRequests--;

      // Complete progress if no more active requests
      if (activeRequests === 0 && progressCallbacks) {
        progressCallbacks.onComplete();
      }
    }
  };
}
