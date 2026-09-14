import React from 'react';
import { Cpu, RefreshCw, Sparkles, Layers, Sliders } from 'lucide-react';
import type { ModelDistributionItem } from '../types';

interface ModelDistributionCardProps {
  models: ModelDistributionItem[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const ModelDistributionCard: React.FC<ModelDistributionCardProps> = ({
  models,
  onRefresh,
  isRefreshing,
}) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Cpu size={17} className="text-brand-500" />
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Phân Bổ Model AI
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Tỷ trọng yêu cầu theo từng model</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
          title="Làm mới"
        >
          <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-brand-600' : ''} />
        </button>
      </div>

      {/* Models List */}
      <div className="space-y-4 flex-1">
        {models.map((m) => (
          <div key={m.model_id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-500 to-amber-500 text-white flex items-center justify-center text-xs font-black shadow-xs">
                  {m.badge || 'AI'}
                </span>
                <div>
                  <span className="font-extrabold text-slate-900 text-xs block">
                    {m.model_name}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    Model Thế Hệ 2
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-extrabold text-slate-800 text-xs block font-mono">
                  {m.request_count} reqs
                </span>
                <span className="text-[10px] font-bold text-brand-600 block">
                  {m.cost_amount}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-amber-400 transition-all duration-500"
                style={{ width: '100%' }}
              />
            </div>

            {/* Supported feature badges */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                <Layers size={10} /> 1K/2K/4K Res
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <Sliders size={10} /> High/Med/Low
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                <Sparkles size={10} /> Smart Cache 25ms
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>Tỷ trọng chiếm:</span>
        <span className="font-bold text-slate-800">100% Lưu lượng</span>
      </div>
    </div>
  );
};
