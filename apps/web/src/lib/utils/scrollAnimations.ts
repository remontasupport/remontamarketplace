/**
 * Scroll Animation Utility
 *
 * Global utility for adding scroll-triggered animations to elements.
 * Uses Intersection Observer API for performance.
 *
 * @example
 * // Initialize in a component
 * useEffect(() => {
 *   initScrollAnimations();
 * }, []);
 *
 * // In your JSX
 * <div className="scroll-animate fade-up" data-delay="1">Content</div>
 */

interface ScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

const DEFAULT_OPTIONS: ScrollAnimationOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px',
  triggerOnce: true,
};

/**
 * Initialize scroll animations for all elements with .scroll-animate class
 */
export function initScrollAnimations(options: ScrollAnimationOptions = {}) {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  // Check if Intersection Observer is supported
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    // Fallback: show all elements immediately
    document.querySelectorAll('.scroll-animate').forEach((el) => {
      el.classList.add('animate-in');
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Add the animate-in class when element is in view
          entry.target.classList.add('animate-in');

          // Optionally stop observing after animation
          if (mergedOptions.triggerOnce) {
            observer.unobserve(entry.target);
          }
        } else if (!mergedOptions.triggerOnce) {
          // Remove animation class when out of view (if not triggerOnce)
          entry.target.classList.remove('animate-in');
        }
      });
    },
    {
      threshold: mergedOptions.threshold,
      rootMargin: mergedOptions.rootMargin,
    }
  );

  // Observe all elements with .scroll-animate class
  const elements = document.querySelectorAll('.scroll-animate');
  elements.forEach((el) => observer.observe(el));

  // Return cleanup function
  return () => {
    elements.forEach((el) => observer.unobserve(el));
    observer.disconnect();
  };
}

/**
 * React hook for scroll animations
 * Automatically initializes and cleans up animations
 *
 * @example
 * function MyComponent() {
 *   useScrollAnimations();
 *   return <div className="scroll-animate fade-up">Content</div>
 * }
 */
export function useScrollAnimations(options?: ScrollAnimationOptions) {
  if (typeof window === 'undefined') return;

  // Initialize on mount
  const cleanup = initScrollAnimations(options);

  // Cleanup on unmount
  return cleanup;
}

/**
 * Add scroll animation to a specific element programmatically
 */
export function animateElement(
  element: HTMLElement,
  animationType: 'fade-up' | 'fade-left' | 'fade-right' | 'scale' = 'fade-up',
  delay?: number
) {
  element.classList.add('scroll-animate', animationType);

  if (delay) {
    element.setAttribute('data-delay', delay.toString());
  }

  // Initialize observer for this specific element
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    }
  );

  observer.observe(element);
}
