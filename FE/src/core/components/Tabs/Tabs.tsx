import React from 'react';
import type { TabsProps } from './Tabs.types';

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'line',
  className = '',
}) => {
  return (
    <div
      className={`flex items-center gap-1 select-none ${
        variant === 'line' ? 'border-b border-slate-200' : 'p-1 bg-slate-100/80 rounded-xl'
      } ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        if (variant === 'pill') {
          return (
            <button
              key={tab.id}
              type="button"
              disabled={tab.disabled}
              onClick={() => !tab.disabled && onChange(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              } ${tab.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {tab.icon && <span className="text-sm">{tab.icon}</span>}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-orange-100 text-brand-600' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        }

        // Line variant
        return (
          <button
            key={tab.id}
            type="button"
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onChange(tab.id)}
            className={`relative flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-all ${
              isActive ? 'text-brand-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            } ${tab.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {tab.icon && <span>{tab.icon}</span>}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                {tab.count}
              </span>
            )}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 rounded-t-full" />
            )}
          </button>
        );
      })}
    </div>
  );
};
