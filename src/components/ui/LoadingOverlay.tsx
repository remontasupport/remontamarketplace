/**
 * Loading Overlay Component
 * Full-page loading spinner overlay for save operations
 */

"use client";

interface LoadingOverlayProps {
  isOpen: boolean;
  message?: string;
}

export default function LoadingOverlay({ isOpen, message = "Saving..." }: LoadingOverlayProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90">
      <div className="flex flex-col items-center justify-center">
        {/* Spinner */}
        <div className="w-12 h-12 border-4 border-gray-200 border-t-teal-600 rounded-full animate-spin"></div>

        {/* Optional message */}
        {message && (
          <p className="mt-4 text-sm font-poppins text-gray-600">{message}</p>
        )}
      </div>
    </div>
  );
}
