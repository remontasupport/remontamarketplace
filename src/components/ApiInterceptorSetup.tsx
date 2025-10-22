"use client";

/**
 * API Interceptor Setup
 *
 * Sets up fetch interceptor on mount
 */

import { useEffect } from 'react';
import { useProgressContext } from '@/contexts/ProgressContext';
import { setupApiInterceptor } from '@/lib/api-interceptor';

export default function ApiInterceptorSetup() {
  const { start, done } = useProgressContext();

  useEffect(() => {
    setupApiInterceptor({
      onStart: start,
      onComplete: done,
    });
  }, [start, done]);

  return null;
}
