import React from 'react';
import { Layers } from 'lucide-react';

interface ResolutionSelectorProps {
  resolution: '1k' | '2k' | '4k';
  onChange: (res: '1k' | '2k' | '4k') => void;
}

const RESOLUTION_OPTIONS = [
  {
    id: '1k',
    title: '1K Chuẩn',
    dims: '1024 × 1024 px',
    desc: 'Tốc độ nhanh nhất, tiết kiệm',
  },
  {
    id: '2k',
    title: '2K Sắc Nét',
    dims: '2048 × 2048 px',
    desc: '⭐️ Khuyên dùng • Độ chi tiết cao',
    recommended: true,
  },
  {
    id: '4k',
    title: '4K Ultra HD',
    dims: '4096 × 4096 px',
    desc: 'Siêu nét, phù hợp in ấn',
  },
] as const;

export const ResolutionSelector: React.FC<ResolutionSelectorProps> = ({ resolution, onChange }) => {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
          <Layers size={13} className="text-brand-500" /> Độ phân giải (Resolution)
        </label>
        <span className="text-[11px] text-slate-400">Kích thước pixel thực tế</span>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {RESOLUTION_OPTIONS.map((opt) => {
          const isSelected = resolution === opt.id;
          return (
            <div
              key={opt.id}
              onClick={() => onChange(opt.id)}
              className={`relative p-2.5 rounded-xl border cursor-pointer transition-all duration-150 flex flex-col justify-between active:scale-[0.98] ${
                isSelected
                  ? 'border-brand-500 bg-brand-50/60 shadow-xs ring-2 ring-brand-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 hover:shadow-2xs'
              }`}
            >
              {'recommended' in opt && opt.recommended && (
                <span className="absolute -top-2 right-2 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-brand-500 text-white shadow-2xs">
                  PHỔ BIẾN
                </span>
              )}
              <div className="flex items-center justify-between">
                <span className={`font-extrabold text-xs ${isSelected ? 'text-brand-700' : 'text-slate-800'}`}>
                  {opt.title}
                </span>
                <span
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${
                    isSelected ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-300 bg-white'
                  }`}
                >
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>
              </div>
              <div className="mt-1">
                <span className="font-mono text-[10px] font-semibold text-slate-500 block">{opt.dims}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5 line-clamp-1">{opt.desc}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
