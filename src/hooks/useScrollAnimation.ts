'use client';

import { useEffect } from 'react';
import { initScrollAnimations } from '@/lib/utils/scrollAnimations';

interface UseScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

/**
 * React hook for scroll animations
 *
 * Automatically initializes scroll animations when component mounts
 * and cleans up when component unmounts.
 *
 * @example
 * function MyComponent() {
 *   useScrollAnimation();
 *
 *   return (
 *     <div>
 *       <h1 className="scroll-animate fade-up">Title</h1>
 *       <p className="scroll-animate fade-up" data-delay="1">Paragraph</p>
 *     </div>
 *   );
 * }
 *
 * @param options - Configuration options for the Intersection Observer
 */
export function useScrollAnimation(options?: UseScrollAnimationOptions) {
  useEffect(() => {
    const cleanup = initScrollAnimations(options);

    return () => {
      if (cleanup) cleanup();
    };
  }, [options]);
}
