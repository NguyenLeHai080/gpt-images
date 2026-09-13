import React from 'react';
import './Button.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <button
      className={`mf-button mf-button--${variant} mf-button--${size} ${fullWidth ? 'mf-button--full-width' : ''} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="mf-button__spinner" />
      ) : (
        <>
          {leftIcon && <span className="mf-button__icon mf-button__icon--left">{leftIcon}</span>}
          <span className="mf-button__text">{children}</span>
          {rightIcon && <span className="mf-button__icon mf-button__icon--right">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
