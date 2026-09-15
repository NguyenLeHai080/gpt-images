import React from 'react';
import { Card } from '../../../core/components/Card/Card';
import { Button } from '../../../core/components/Button/Button';
import { Badge } from '../../../core/components/Badge/Badge';
import { Server, RefreshCw, AlertTriangle } from 'lucide-react';
import { formatDateTimeVN } from '../../../core/utils/date';
import type { ProviderStatus } from '../types';

interface ProviderWalletCardProps {
  status: ProviderStatus | null;
  isSyncing: boolean;
  onSync: () => void;
}

export const ProviderWalletCard: React.FC<ProviderWalletCardProps> = ({
  status,
  isSyncing,
  onSync,
}) => {
  const formatVND = (num: number) => new Intl.NumberFormat('vi-VN').format(num) + ' đ';

  return (
    <Card padding="md" className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
          <Server size={18} className="text-purple-600" />
          <span>Cụm Máy Chủ AI Engine (Processing Cluster)</span>
        </div>
        <Badge variant={status?.is_connected ? 'success' : 'warning'}>
          {status?.is_connected ? 'Đang kết nối' : 'Đang kiểm tra'}
        </Badge>
      </div>

      {status?.low_balance_warning && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-800 text-xs flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-600 shrink-0" />
          <span>
            <strong>Cảnh báo:</strong> Quota máy chủ còn dưới 5.000 đ! Vui lòng nạp thêm hạn mức quota cho cụm xử lý AI Engine.
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div>
          <span className="text-slate-400 block text-[10px]">Cổng NCC chính:</span>
          <span className="font-bold text-purple-700 truncate block" title={status?.provider_name || 'Chưa cấu hình'}>
            {status?.provider_name || 'Chưa cấu hình'}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px]">Key giới hạn API:</span>
          <span className="font-bold text-slate-800 font-mono text-[11px] truncate block" title={status?.key_masked || 'Chưa cấu hình'}>
            {status?.key_masked || 'Chưa cấu hình'}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px]">Số dư còn lại (Quota):</span>
          <span className="font-bold text-emerald-600 text-sm">
            {formatVND(status?.budget_remaining ?? status?.wallet_balance ?? 0)}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px]">Ước tính tạo thêm:</span>
          <span className="font-bold text-amber-600">
            ~ {Math.floor((status?.budget_remaining ?? status?.wallet_balance ?? 0) / 75)} ảnh
          </span>
        </div>
      </div>

      {/* QuotaGuard Live Breakdown (đồng bộ trực tiếp API nhà cung cấp) */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-slate-100 shadow-inner">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 text-xs font-bold">●</span>
            <span className="text-xs font-semibold text-slate-200">
              Hạn mức API Nhà Cung Cấp (Đồng bộ QuotaGuard Engine)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[10px] font-mono text-emerald-400 font-medium">
              {status?.status_text || 'Bình thường'}
            </span>
          </div>
        </div>

        {/* Budget Progress bar */}
        <div className="space-y-1.5 mb-3">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">
              Đã dùng: <span className="text-slate-200 font-mono font-medium">{formatVND(status?.budget_used ?? 0)}</span> / <span className="text-slate-300 font-mono">{formatVND(status?.budget_total ?? 100000)}</span> ({((status?.budget_used ?? 0) / (status?.budget_total || 100000) * 100).toFixed(1)}%)
            </span>
            <span className="text-emerald-400 font-mono font-semibold">
              Còn lại: {formatVND(status?.budget_remaining ?? status?.wallet_balance ?? 100000)}
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(3, 100 - ((status?.budget_used ?? 0) / (status?.budget_total || 100000) * 100)))}%`,
              }}
            />
          </div>
        </div>

        {/* Rate breakdown per model */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800/60">
          {(status?.models_rates && status.models_rates.length > 0
            ? status.models_rates
            : [
                { model: 'gpt-image-2.5-flare', display_name: 'GPT Image 2.5 Flare', cost_per_req: 75, unit: 'đ / request' },
                { model: 'gpt-image-2.5-sunburst', display_name: 'GPT Image 2.5 Sunburst', cost_per_req: 75, unit: 'đ / request' },
                { model: 'gpt-image-2', display_name: 'GPT Image 2', cost_per_req: 70, unit: 'đ / request' },
                { model: 'gemini-3.1-flash-image-preview', display_name: 'Gemini 3.1 Flash Image', cost_per_req: 50, unit: 'đ / request' },
              ]
          ).map((item) => (
            <div
              key={item.model}
              className="flex items-center justify-between bg-slate-900/90 rounded-lg px-2.5 py-1.5 border border-slate-800"
            >
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-amber-400 text-xs">⚡</span>
                <span className="font-mono text-slate-300 truncate" title={item.model}>
                  {item.model}
                </span>
              </div>
              <div className="text-right shrink-0 font-mono">
                <span className="text-emerald-400 font-semibold">{item.cost_per_req} đ</span>
                <span className="text-slate-500 text-[10px]"> /req</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
        <span>Đồng bộ lần cuối: {status ? formatDateTimeVN(status.last_synced_at) : 'Vừa xong'}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={onSync}
          disabled={isSyncing}
          leftIcon={<RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />}
        >
          {isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ Ví NCC'}
        </Button>
      </div>
    </Card>
  );
};
