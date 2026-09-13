import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, RefreshCw } from 'lucide-react';
import { ERROR_PRESETS, ERROR_ICONS } from './errorPresets';
import type { ErrorStateProps } from './ErrorState.types';

export const ErrorState: React.FC<ErrorStateProps> = ({
  code = '404',
  title,
  description,
  extra,
  actionText,
  onAction,
  showBackButton = true,
  showHomeButton = true,
  compact = false,
  className = '',
}) => {
  const navigate = useNavigate();
  const preset = ERROR_PRESETS[code] || ERROR_PRESETS['custom'];
  const IconComponent = ERROR_ICONS[code] || ERROR_ICONS['custom'];

  const displayTitle = title || preset.title;
  const displayDesc = description || preset.description;
  const displayActionText = actionText || preset.defaultActionText;

  const handlePrimaryAction = () => {
    if (onAction) {
      onAction();
    } else if (code === '500' || code === 'network') {
      window.location.reload();
    } else {
      navigate('/app/overview');
    }
  };

  return (
    <div
      className={`flex flex-col items-center justify-center text-center select-none ${
        compact ? 'py-8 px-4' : 'py-14 px-6 min-h-[360px]'
      } ${className}`}
    >
      {/* Icon with glowing ring */}
      <div className="relative mb-5 flex items-center justify-center">
        <div className="absolute w-16 h-16 bg-orange-500/10 rounded-full animate-ping opacity-50" />
        <div className="relative w-16 h-16 bg-gradient-to-br from-orange-50 to-orange-100/70 border border-orange-200/80 rounded-2xl flex items-center justify-center text-brand-600 shadow-sm">
          <IconComponent size={30} className="stroke-[1.8]" />
        </div>
      </div>

      {/* Code Badge */}
      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-bold tracking-wider mb-2.5 uppercase">
        {preset.badge}
      </div>

      {/* Title */}
      <h2
        className={`font-black text-slate-900 tracking-tight mb-2 ${
          compact ? 'text-lg' : 'text-2xl sm:text-3xl'
        }`}
      >
        {displayTitle}
      </h2>

      {/* Description */}
      <p className="text-slate-500 text-xs sm:text-sm max-w-md leading-relaxed mb-6">
        {displayDesc}
      </p>

      {/* Custom Extra content if any */}
      {extra && <div className="mb-6 w-full max-w-md">{extra}</div>}

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {showBackButton && (
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft size={14} />
            <span>Quay lại</span>
          </button>
        )}

        <button
          onClick={handlePrimaryAction}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-lg shadow-sm transition-all shadow-brand-500/20 active:scale-95"
        >
          {code === '500' || code === 'network' ? <RefreshCw size={14} /> : <Home size={14} />}
          <span>{displayActionText}</span>
        </button>

        {showHomeButton && code !== '404' && (
          <button
            onClick={() => navigate('/app/overview')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <Home size={14} />
            <span>Trang chủ</span>
          </button>
        )}
      </div>
    </div>
  );
};