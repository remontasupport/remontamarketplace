"use client";

/**
 * Progress Context
 *
 * Global progress state for API calls and navigation
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useProgress } from '@/hooks/useProgress';

type ProgressContextType = {
  start: () => void;
  done: () => void;
  reset: () => void;
  state: 'initial' | 'loading' | 'complete';
  value: number;
};

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const progress = useProgress();

  return (
    <ProgressContext.Provider value={progress}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgressContext() {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgressContext must be used within ProgressProvider');
  }
  return context;
}
