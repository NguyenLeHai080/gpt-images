import React from 'react';
import { Card } from '../../../core/components/Card/Card';
import { Button } from '../../../core/components/Button/Button';
import { Badge } from '../../../core/components/Badge/Badge';
import { Server, RefreshCw, AlertTriangle } from 'lucide-react';
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
          <span className="text-slate-400 block text-[10px]">Cụm xử lý (Node):</span>
          <span className="font-mono font-bold text-purple-700">{status?.username || 'cluster-worker-01'}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px]">Model cung ứng:</span>
          <span className="font-bold text-orange-600 font-mono">gpt-image-2</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px]">Số dư khả dụng:</span>
          <span className="font-bold text-slate-900 text-sm">
            {formatVND(status?.wallet_balance ?? 24462)}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px]">Ước tính tạo thêm:</span>
          <span className="font-bold text-amber-600">
            ~ {Math.floor((status?.wallet_balance ?? 24462) / 120)} ảnh
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
        <span>Đồng bộ lần cuối: {status ? new Date(status.last_synced_at).toLocaleTimeString('vi-VN') : 'Vừa xong'}</span>
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
