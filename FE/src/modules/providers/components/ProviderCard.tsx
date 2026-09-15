import React, { useState } from 'react';
import { Card } from '../../../core/components/Card/Card';
import { Button } from '../../../core/components/Button/Button';
import { Badge } from '../../../core/components/Badge/Badge';
import {
  Server,
  Zap,
  Activity,
  Copy,
  Check,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  ShieldCheck,
  Clock,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import type { AIProvider } from '../types';

interface ProviderCardProps {
  provider: AIProvider;
  onSetPrimary: (id: string) => void;
  onTestPing: (id: string) => Promise<void>;
  onEdit: (provider: AIProvider) => void;
  onDelete: (id: string, name: string) => void;
  isTestingPing?: boolean;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({
  provider,
  onSetPrimary,
  onTestPing,
  onEdit,
  onDelete,
  isTestingPing = false,
}) => {
  const [showFullKey, setShowFullKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const formatVND = (num: number) =>
    new Intl.NumberFormat('vi-VN').format(num) + ' đ';

  const handleCopyKey = () => {
    const keyToCopy = provider.api_key || provider.api_key_masked;
    navigator.clipboard.writeText(keyToCopy);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(provider.base_url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const getStatusBadge = () => {
    switch (provider.status) {
      case 'ONLINE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Online
          </span>
        );
      case 'STANDBY':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Dự phòng
          </span>
        );
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <AlertCircle size={12} className="text-red-500" />
            Lỗi kết nối
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            Tạm dừng
          </span>
        );
    }
  };

  return (
    <Card
      padding="lg"
      className={`relative transition-all duration-300 ${
        provider.is_primary
          ? 'border-2 border-brand-500/80 shadow-md ring-4 ring-brand-500/10'
          : 'border border-slate-200 hover:border-slate-300 hover:shadow-xs'
      }`}
    >
      {/* Primary Indicator Tag */}
      {provider.is_primary && (
        <div className="absolute -top-3 left-6 bg-gradient-to-r from-brand-600 to-amber-500 text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-xs flex items-center gap-1.5 tracking-wide uppercase">
          <Zap size={12} className="fill-white" />
          NCC Chính Đang Xử Lý
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
        <div className="flex items-start gap-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
              provider.is_primary
                ? 'bg-gradient-to-tr from-brand-500 to-amber-500 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            <Server size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base">
                {provider.name}
              </h3>
              {provider.is_primary && (
                <Badge variant="brand">Primary</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                {provider.provider_code}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock size={12} className="text-slate-400" />
                Cập nhật: {provider.updated_at || 'Mới đây'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {getStatusBadge()}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-slate-100 text-slate-700">
            <Activity size={12} className="text-brand-500" />
            {provider.latency_ms} ms
          </span>
        </div>
      </div>

      {/* Body Details */}
      <div className="space-y-3 text-xs mb-5">
        {/* Base URL */}
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Endpoint Base URL
            </span>
            <span className="font-mono text-slate-800 text-xs truncate block select-all">
              {provider.base_url}
            </span>
          </div>
          <button
            onClick={handleCopyUrl}
            title="Copy URL"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            {copiedUrl ? (
              <Check size={14} className="text-emerald-600" />
            ) : (
              <Copy size={14} />
            )}
          </button>
        </div>

        {/* API Key */}
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              API Key (Authorization Bearer)
            </span>
            <span className="font-mono text-slate-800 text-xs truncate block select-all">
              {showFullKey && provider.api_key
                ? provider.api_key
                : provider.api_key_masked}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {provider.api_key && (
              <button
                onClick={() => setShowFullKey(!showFullKey)}
                title={showFullKey ? 'Ẩn khóa' : 'Hiện khóa'}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                {showFullKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            )}
            <button
              onClick={handleCopyKey}
              title="Copy API Key"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              {copiedKey ? (
                <Check size={14} className="text-emerald-600" />
              ) : (
                <Copy size={14} />
              )}
            </button>
          </div>
        </div>

        {/* Models & Pricing Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Model mặc định & Khả dụng
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono font-bold text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                <Sparkles size={10} />
                {provider.default_model}
              </span>
              {provider.models_supported
                .filter((m) => m !== provider.default_model)
                .slice(0, 3)
                .map((m) => (
                  <span
                    key={m}
                    className="font-mono text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[10px]"
                  >
                    {m}
                  </span>
                ))}
              {provider.models_supported.length > 4 && (
                <span className="text-[10px] text-slate-400">
                  +{provider.models_supported.length - 4} nữa
                </span>
              )}
            </div>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Giá vốn / ảnh thành công
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-extrabold text-slate-900">
                {formatVND(provider.cost_per_image)}
              </span>
              <span className="text-[11px] text-slate-500">
                (bán ra: 150đ)
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {provider.notes && (
          <p className="text-[11px] text-slate-500 italic bg-slate-50/50 p-2 rounded-lg border border-slate-100">
            {provider.notes}
          </p>
        )}
      </div>

      {/* Footer Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3.5">
        <div className="flex items-center gap-2">
          {!provider.is_primary ? (
            <Button
              size="sm"
              variant="primary"
              onClick={() => onSetPrimary(provider.id)}
              className="font-bold flex items-center gap-1.5"
            >
              <Zap size={14} />
              Đặt làm NCC Chính
            </Button>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
              <ShieldCheck size={14} />
              Đang làm Cổng Chính
            </span>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => onTestPing(provider.id)}
            disabled={isTestingPing}
            className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-brand-600"
          >
            <Activity
              size={14}
              className={isTestingPing ? 'animate-spin text-brand-600' : ''}
            />
            {isTestingPing ? 'Đang ping...' : 'Kiểm tra Ping'}
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(provider)}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Chỉnh sửa NCC"
          >
            <Edit2 size={15} />
          </button>
          {!provider.is_primary && (
            <button
              onClick={() => onDelete(provider.id, provider.name)}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Xóa NCC"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>
    </Card>
  );
};
