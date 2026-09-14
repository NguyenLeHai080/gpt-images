import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
  fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconClick,
  fullWidth = true,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`mf-input-wrapper ${fullWidth ? 'mf-input-wrapper--full-width' : ''} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="mf-input-label">
          {label}
        </label>
      )}
      <div className={`mf-input-container ${error ? 'mf-input-container--error' : ''}`}>
        {leftIcon && <span className="mf-input__icon mf-input__icon--left">{leftIcon}</span>}
        <input
          id={inputId}
          className={`mf-input ${leftIcon ? 'mf-input--has-left' : ''} ${rightIcon ? 'mf-input--has-right' : ''}`}
          {...props}
        />
        {rightIcon && (
          <button
            type="button"
            className="mf-input__icon mf-input__icon--right mf-input__icon--clickable"
            onClick={onRightIconClick}
            tabIndex={-1}
          >
            {rightIcon}
          </button>
        )}
      </div>
      {error && <span className="mf-input-error">{error}</span>}
    </div>
  );
};
