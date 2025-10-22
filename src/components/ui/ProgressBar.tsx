"use client";

/**
 * Global Progress Bar Component
 *
 * Shows at the top of the page during loading
 */

import { useProgressContext } from '@/contexts/ProgressContext';

export default function ProgressBar() {
  const { state, value } = useProgressContext();

  if (state === 'initial') return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 h-1 bg-blue-600 transition-all duration-300 ease-out z-50"
      style={{
        width: `${value}%`,
        opacity: state === 'complete' ? 0 : 1,
      }}
    >
      {/* Glow effect */}
      <div className="absolute right-0 top-0 h-full w-20 bg-gradient-to-l from-blue-400 to-transparent" />
    </div>
  );
}
