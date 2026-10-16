/**
 * useProgress Hook
 *
 * Manages progress state for loading indicators
 * Works with Next.js App Router transitions
 */

import { useState, useCallback, useRef } from 'react';

type ProgressState = 'initial' | 'loading' | 'complete';

export function useProgress() {
  const [state, setState] = useState<ProgressState>('initial');
  const [value, setValue] = useState(0);
  // The running interval: cleared by done() and by a new start(), so a finished bar never creeps back to 90%.
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  // Several callers share the one bar (a page change, the fetches it makes): each start() is matched by a done(),
  // and the bar finishes only when the last caller is done -- a fetch ending no longer cuts a navigation short.
  const active = useRef(0);

  const start = useCallback(() => {
    active.current += 1;
    if (active.current > 1) return;
    clearInterval(timer.current);
    setState('loading');
    setValue(10);

    // Simulate progress: quick at first, slower towards 90%.
    timer.current = setInterval(() => {
      setValue((prev) => {
        if (prev >= 90) {
          clearInterval(timer.current);
          return 90;
        }
        return prev + Math.max(2, Math.round((90 - prev) / 6));
      });
    }, 150);

    return () => clearInterval(timer.current);
  }, []);

  const done = useCallback(() => {
    if (active.current === 0) return;
    active.current -= 1;
    if (active.current > 0) return;
    clearInterval(timer.current);
    setValue(100);
    setState('complete');

    // Reset after animation completes
    setTimeout(() => {
      if (active.current > 0) return; // a new start() since
      setState('initial');
      setValue(0);
    }, 500);
  }, []);

  const reset = useCallback(() => {
    active.current = 0;
    clearInterval(timer.current);
    setState('initial');
    setValue(0);
  }, []);

  return { start, done, reset, state, value };
}
