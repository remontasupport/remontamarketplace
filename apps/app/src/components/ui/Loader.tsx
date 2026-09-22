/**
 * Loader Component
 * Lightweight, reusable spinner with pure CSS animation
 */

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Loader({ size = 'md', className = '' }: LoaderProps) {
  const sizeClasses = {
    sm: 'loader-sm',
    md: 'loader-md',
    lg: 'loader-lg',
  };

  return (
    <div className={`loader ${sizeClasses[size]} ${className}`} role="status" aria-label="Loading">
      <div className="loader-spinner"></div>
    </div>
  );
}
