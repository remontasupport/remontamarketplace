/**
 * useProgress Hook
 *
 * Manages progress state for loading indicators
 * Works with Next.js App Router transitions
 */

import { useEffect, useState, useCallback } from 'react';

type ProgressState = 'initial' | 'loading' | 'complete';

export function useProgress() {
  const [state, setState] = useState<ProgressState>('initial');
  const [value, setValue] = useState(0);

  const start = useCallback(() => {
    setState('loading');
    setValue(0);

    // Simulate progress
    const interval = setInterval(() => {
      setValue((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  const done = useCallback(() => {
    setValue(100);
    setState('complete');

    // Reset after animation completes
    setTimeout(() => {
      setState('initial');
      setValue(0);
    }, 500);
  }, []);

  const reset = useCallback(() => {
    setState('initial');
    setValue(0);
  }, []);

  return { start, done, reset, state, value };
}
