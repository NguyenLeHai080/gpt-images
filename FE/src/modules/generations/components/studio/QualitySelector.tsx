import React from 'react';
import { Sliders } from 'lucide-react';

interface QualitySelectorProps {
  quality: 'low' | 'medium' | 'high';
  onChange: (q: 'low' | 'medium' | 'high') => void;
}

const QUALITY_OPTIONS = [
  { id: 'high', label: 'High', icon: '✨', desc: 'Siêu nét' },
  { id: 'medium', label: 'Medium', icon: '⚖️', desc: 'Tiêu chuẩn' },
  { id: 'low', label: 'Low', icon: '⚡', desc: 'Tốc độ' },
] as const;

export const QualitySelector: React.FC<QualitySelectorProps> = ({ quality, onChange }) => {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
          <Sliders size={13} className="text-purple-500" /> Chất lượng (Quality)
        </label>
        <span className="text-[11px] text-purple-600 font-bold uppercase">{quality}</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {QUALITY_OPTIONS.map((q) => {
          const isSelected = quality === q.id;
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => onChange(q.id)}
              className={`p-2 rounded-xl border text-center transition-all duration-150 active:scale-95 ${
                isSelected
                  ? 'border-purple-500 bg-purple-50/60 text-purple-900 ring-2 ring-purple-500/20 font-bold shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700 hover:shadow-2xs'
              }`}
            >
              <span className="text-sm block transition-transform group-hover:scale-110">{q.icon}</span>
              <span className="font-bold text-xs block mt-0.5">{q.label}</span>
              <span className="text-[10px] text-slate-400 block">{q.desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
