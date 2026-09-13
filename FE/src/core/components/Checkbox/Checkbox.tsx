import React from 'react';
import { Check } from 'lucide-react';
import type { CheckboxProps } from './Checkbox.types';

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  id,
  className = '',
}) => {
  const inputId = id || `mf-chk-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <label
      htmlFor={inputId}
      className={`inline-flex items-start gap-2.5 cursor-pointer select-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      <div className="relative flex items-center justify-center mt-0.5">
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={`w-4 h-4 rounded-[5px] border transition-all duration-150 flex items-center justify-center ${
            checked
              ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
              : 'border-slate-300 bg-white hover:border-brand-500'
          }`}
        >
          {checked && <Check size={12} strokeWidth={3} />}
        </div>
      </div>

      {(label || description) && (
        <div className="flex flex-col text-xs">
          {label && <span className="font-medium text-slate-700">{label}</span>}
          {description && <span className="text-slate-400 mt-0.5">{description}</span>}
        </div>
      )}
    </label>
  );
};
