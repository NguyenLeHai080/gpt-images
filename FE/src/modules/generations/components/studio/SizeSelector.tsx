import React, { useState } from 'react';
import { Maximize2, ChevronDown, ChevronUp } from 'lucide-react';

export interface SizeOption {
  id: string; // e.g. "1024x1024", "1792x1024"
  label: string; // "Vuông (1:1)"
  ratio: string; // "1:1"
  resolution: '1k' | '2k' | '4k';
  dimensions: string; // "1024 × 1024 px"
  desc: string; // "Avatar, Bài viết"
  badge?: string;
  boxClass: string;
}

export const SIZE_OPTIONS: SizeOption[] = [
  // 3 Kích thước phổ biến nhất (Primary)
  {
    id: '1024x1024',
    label: 'Vuông (1:1)',
    ratio: '1:1',
    resolution: '1k',
    dimensions: '1024 × 1024 px',
    desc: 'Avatar, Mạng xã hội',
    badge: 'Mặc định',
    boxClass: 'w-4 h-4',
  },
  {
    id: '1792x1024',
    label: 'Ngang (16:9)',
    ratio: '16:9',
    resolution: '1k',
    dimensions: '1792 × 1024 px',
    desc: 'Máy tính, Màn rộng, Banner',
    badge: 'Khổ rộng',
    boxClass: 'w-6 h-3.5',
  },
  {
    id: '1024x1792',
    label: 'Dọc (9:16)',
    ratio: '9:16',
    resolution: '1k',
    dimensions: '1024 × 1792 px',
    desc: 'Điện thoại, TikTok, Reels',
    badge: 'Khổ dọc',
    boxClass: 'w-3.5 h-6',
  },
  // Kích thước bổ trợ (Secondary)
  {
    id: '1024x768',
    label: 'Chuẩn (4:3)',
    ratio: '4:3',
    resolution: '1k',
    dimensions: '1024 × 768 px',
    desc: 'Màn hình ngang chuẩn',
    boxClass: 'w-5 h-4',
  },
  {
    id: '768x1024',
    label: 'Chân dung (3:4)',
    ratio: '3:4',
    resolution: '1k',
    dimensions: '768 × 1024 px',
    desc: 'Ảnh chụp chân dung, Poster',
    boxClass: 'w-4 h-5',
  },
  {
    id: '2048x2048',
    label: 'Vuông 2K HD',
    ratio: '1:1',
    resolution: '2k',
    dimensions: '2048 × 2048 px',
    desc: 'Độ nét cao siêu chi tiết',
    badge: '2K HD',
    boxClass: 'w-4 h-4',
  },
];

const PRIMARY_IDS = ['1024x1024', '1792x1024', '1024x1792'];

interface SizeSelectorProps {
  selectedSize: string;
  onChange: (size: SizeOption) => void;
}

export const SizeSelector: React.FC<SizeSelectorProps> = ({ selectedSize, onChange }) => {
  const [showMore, setShowMore] = useState(
    () => !PRIMARY_IDS.includes(selectedSize) // Tự mở nếu user đang chọn một size nâng cao
  );

  const primaryOptions = SIZE_OPTIONS.filter((opt) => PRIMARY_IDS.includes(opt.id));
  const moreOptions = SIZE_OPTIONS.filter((opt) => !PRIMARY_IDS.includes(opt.id));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
          <Maximize2 size={13} className="text-brand-500" />
          <span>Tỷ lệ khung hình</span>
        </label>
        <button
          type="button"
          onClick={() => setShowMore(!showMore)}
          className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors"
        >
          {showMore ? (
            <>
              Thu gọn <ChevronUp size={12} />
            </>
          ) : (
            <>
              Thêm tỷ lệ khác (4:3, 3:4, 2K) <ChevronDown size={12} />
            </>
          )}
        </button>
      </div>

      {/* 3 Tùy chọn chính: To, rõ, trực quan */}
      <div className="grid grid-cols-3 gap-2.5">
        {primaryOptions.map((opt) => {
          const isSelected = selectedSize === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt)}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-between text-center transition-all duration-150 active:scale-98 ${
                isSelected
                  ? 'border-brand-500 bg-brand-50/70 text-brand-950 ring-2 ring-brand-500/20 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700 hover:bg-slate-50/70'
              }`}
            >
              {/* Hình minh họa trực quan khung hình */}
              <div className="h-7 flex items-center justify-center">
                <div
                  className={`border-2 rounded-xs transition-all ${
                    isSelected ? 'border-brand-500 bg-brand-200/60' : 'border-slate-300 bg-slate-100'
                  } ${opt.boxClass}`}
                />
              </div>

              <div className="mt-1.5 w-full">
                <span className={`font-bold text-xs block ${isSelected ? 'text-brand-700' : 'text-slate-800'}`}>
                  {opt.label}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5 truncate">
                  {opt.desc}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Các tùy chọn mở rộng nếu cần */}
      {showMore && (
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 animate-fade-in">
          {moreOptions.map((opt) => {
            const isSelected = selectedSize === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange(opt)}
                className={`p-2 rounded-lg border flex items-center gap-2 text-left transition-all ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50/80 text-brand-900 ring-1 ring-brand-500/30'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-white text-slate-700'
                }`}
              >
                <div
                  className={`border rounded-xs shrink-0 ${
                    isSelected ? 'border-brand-500 bg-brand-200' : 'border-slate-300 bg-slate-100'
                  } ${opt.boxClass}`}
                />
                <div className="min-w-0">
                  <span className="font-semibold text-[11px] block truncate">{opt.label}</span>
                  <span className="text-[9px] text-slate-400 block font-mono truncate">{opt.dimensions}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
