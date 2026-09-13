import React from 'react';

export interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className = '',
}) => {
  const variantClasses = {
    text: 'rounded h-4 w-full',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  }[variant];

  const style: React.CSSProperties = {
    width: width ?? (variant === 'circular' ? 40 : undefined),
    height: height ?? (variant === 'circular' ? 40 : undefined),
  };

  return (
    <div
      style={style}
      className={`animate-pulse bg-slate-200/80 ${variantClasses} ${className}`}
      aria-hidden="true"
    />
  );
};
