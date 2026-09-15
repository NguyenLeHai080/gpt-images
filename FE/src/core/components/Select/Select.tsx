import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check, Search } from 'lucide-react';
import type { SelectProps } from './Select.types';

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Chọn một mục...',
  disabled = false,
  clearable = false,
  searchable = false,
  className = '',
  size = 'md',
  placement = 'auto',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Tính toán hướng mở (trên hay dưới) khi mở dropdown
  useEffect(() => {
    if (isOpen) {
      if (placement === 'top') {
        setOpenUpward(true);
      } else if (placement === 'bottom') {
        setOpenUpward(false);
      } else if (wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect();
        const scrollParent =
          wrapperRef.current.closest('.overflow-y-auto') ||
          wrapperRef.current.closest('.overflow-auto');
        let spaceBelow = window.innerHeight - rect.bottom;
        if (scrollParent) {
          const parentRect = scrollParent.getBoundingClientRect();
          spaceBelow = parentRect.bottom - rect.bottom;
        }
        setOpenUpward(spaceBelow < 220);
      }
    }
  }, [isOpen, placement]);

  const filteredOptions = searchable
    ? options.filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-3.5 py-2.5 text-xs',
    lg: 'px-4 py-3 text-sm',
  }[size];

  return (
    <div ref={wrapperRef} className={`relative inline-block w-full text-left select-none ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between rounded-xl border bg-white text-slate-800 shadow-2xs transition-all ${sizeClasses} ${
          isOpen
            ? 'border-brand-500 ring-2 ring-brand-500/20 shadow-sm bg-white'
            : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50/40'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'cursor-pointer'}`}
      >
        <span className={`truncate ${!selectedOption ? 'text-slate-400 font-normal' : 'font-semibold text-slate-800'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <div className="flex items-center gap-1.5 ml-2 shrink-0">
          {clearable && selectedOption && !disabled && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="p-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X size={13} />
            </span>
          )}
          <ChevronDown
            size={14}
            className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-brand-500' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute z-50 w-full min-w-[220px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl animate-fade-in ${
            openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          }`}
        >
          {searchable && (
            <div className="flex items-center gap-2 px-2.5 py-1.5 mb-1 border-b border-slate-100">
              <Search size={13} className="text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm..."
                className="w-full bg-transparent text-xs text-slate-700 outline-none placeholder-slate-400"
                autoFocus
              />
            </div>
          )}

          <div className="max-h-56 overflow-y-auto custom-scrollbar-light space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="py-2.5 px-3 text-center text-xs text-slate-400 font-medium">Không có lựa chọn nào</div>
            ) : (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => {
                    if (!opt.disabled) {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearch('');
                    }
                  }}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    opt.disabled
                      ? 'opacity-40 cursor-not-allowed text-slate-400'
                      : opt.value === value
                      ? 'bg-orange-50 text-brand-600 font-semibold cursor-pointer'
                      : 'text-slate-700 hover:bg-slate-50 cursor-pointer'
                  }`}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="truncate">{opt.label}</span>
                    {opt.sublabel && (
                      <span className="text-[10px] text-slate-400 font-normal truncate mt-0.5">
                        {opt.sublabel}
                      </span>
                    )}
                  </div>
                  {opt.value === value && <Check size={14} className="text-brand-600 shrink-0 ml-1" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
