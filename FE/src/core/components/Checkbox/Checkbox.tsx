import React from 'react';
import { Check, Minus } from 'lucide-react';
import type { CheckboxProps } from './Checkbox.types';

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  indeterminate = false,
  size = 'md',
  variant = 'brand',
  id,
  className = '',
}) => {
  const inputId = id || `mf-chk-${Math.random().toString(36).substring(2, 9)}`;

  const sizeClasses = {
    sm: 'w-3.5 h-3.5 rounded-[4px]',
    md: 'w-4 h-4 rounded-[4px]',
    lg: 'w-5 h-5 rounded-[5px]',
  }[size];

  const iconSize = {
    sm: 10,
    md: 11,
    lg: 13,
  }[size];

  const activeColorClasses = {
    brand: 'bg-brand-600 border-brand-600 text-white shadow-2xs',
    purple: 'bg-purple-600 border-purple-600 text-white shadow-2xs',
    sky: 'bg-sky-600 border-sky-600 text-white shadow-2xs',
    emerald: 'bg-emerald-600 border-emerald-600 text-white shadow-2xs',
  }[variant];

  const isActive = checked || indeterminate;

  return (
    <label
      htmlFor={inputId}
      className={`inline-flex items-start gap-2.5 cursor-pointer select-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      <div className="relative flex items-center justify-center mt-0.5 shrink-0">
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={`${sizeClasses} border transition-all duration-150 flex items-center justify-center ${
            isActive
              ? activeColorClasses
              : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50'
          }`}
        >
          {indeterminate ? (
            <Minus size={iconSize} strokeWidth={3} />
          ) : checked ? (
            <Check size={iconSize} strokeWidth={3} />
          ) : null}
        </div>
      </div>

      {(label || description) && (
        <div className="flex flex-col text-xs leading-tight">
          {label && <span className="font-medium text-slate-700">{label}</span>}
          {description && <span className="text-slate-400 mt-0.5">{description}</span>}
        </div>
      )}
    </label>
  );
};
