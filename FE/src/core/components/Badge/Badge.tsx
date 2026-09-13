import React from 'react';
import './Badge.css';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'info' | 'purple' | 'danger' | 'dark' | 'brand';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'brand',
  size = 'sm',
  className = '',
  ...props
}) => {
  return (
    <span className={`mf-badge mf-badge--${variant} mf-badge--${size} ${className}`} {...props}>
      {children}
    </span>
  );
};
