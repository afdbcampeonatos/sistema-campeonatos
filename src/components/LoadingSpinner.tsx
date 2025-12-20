'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner = ({ size = 'md', className = '' }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const borderWidth = {
    sm: 'border-[2px]',
    md: 'border-2',
    lg: 'border-[3px]',
  };

  return (
    <div
      className={`${sizeClasses[size]} ${borderWidth[size]} border-blue-900/20 border-t-blue-900 rounded-full animate-spin ${className}`}
    ></div>
  );
};

