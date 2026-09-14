import React from 'react';
import { Ratio } from 'lucide-react';

interface AspectRatioSelectorProps {
  aspectRatio: string;
  onChange: (ar: string) => void;
}

const ASPECT_OPTIONS = [
  { id: '1:1', label: '1:1', sub: 'Vuông', box: 'w-4 h-4' },
  { id: '16:9', label: '16:9', sub: 'Ngang', box: 'w-5 h-3' },
  { id: '9:16', label: '9:16', sub: 'Dọc', box: 'w-3 h-5' },
  { id: '4:3', label: '4:3', sub: 'Chuẩn', box: 'w-4.5 h-3.5' },
] as const;

export const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({ aspectRatio, onChange }) => {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
          <Ratio size={13} className="text-blue-500" /> Tỷ lệ khung hình
        </label>
        <span className="text-[11px] text-blue-600 font-bold">{aspectRatio}</span>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {ASPECT_OPTIONS.map((ratio) => {
          const isSelected = aspectRatio === ratio.id;
          return (
            <button
              key={ratio.id}
              type="button"
              onClick={() => onChange(ratio.id)}
              className={`p-1.5 rounded-xl border flex flex-col items-center justify-center transition-all duration-150 active:scale-95 h-[68px] ${
                isSelected
                  ? 'border-blue-500 bg-blue-50/60 text-blue-900 ring-2 ring-blue-500/20 font-bold shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700 hover:shadow-2xs'
              }`}
            >
              <div
                className={`border-2 rounded-xs mb-1 transition-all ${
                  isSelected ? 'border-blue-500 bg-blue-200/50 scale-105' : 'border-slate-300 bg-slate-100'
                } ${ratio.box}`}
              />
              <span className="font-bold text-[11px]">{ratio.label}</span>
              <span className="text-[9px] text-slate-400">{ratio.sub}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
