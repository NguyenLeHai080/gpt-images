import React from 'react';
import { Zap } from 'lucide-react';

interface SmartCacheToggleProps {
  forceRefresh: boolean;
  onChange: (force: boolean) => void;
}

export const SmartCacheToggle: React.FC<SmartCacheToggleProps> = ({ forceRefresh, onChange }) => {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-200/80">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
          <Zap size={16} />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-800 text-xs">Smart Cache thông minh</span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              ⚡ 0đ vốn NCC
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {forceRefresh
              ? 'Đang bật: Bỏ qua Cache, gọi nhà cung cấp để tạo ra góc nhìn / biến thể mới'
              : 'Tự động phản hồi tức thì (25ms) nếu prompt và thông số đã được tạo trước đó'}
          </p>
        </div>
      </div>

      <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
        <input
          type="checkbox"
          checked={forceRefresh}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
      </label>
    </div>
  );
};
