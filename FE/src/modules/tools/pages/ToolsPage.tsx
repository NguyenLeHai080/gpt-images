import React, { useState, useEffect, useCallback } from 'react';
import { Zap, Server, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '../../../core/components/Button/Button';
import { Badge } from '../../../core/components/Badge/Badge';
import { Input } from '../../../core/components/Input/Input';
import { alert } from '../../../core/alert';
import { toolsApi } from '../api';
import type { SystemGatewayConfig, UpdateGatewayConfigRequest } from '../types';

export const ToolsPage: React.FC = () => {
  const [config, setConfig] = useState<SystemGatewayConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFlushing, setIsFlushing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState<UpdateGatewayConfigRequest>({});

  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await toolsApi.getConfig();
      if (res.success && res.data) {
        setConfig(res.data);
        setFormData({
          smart_cache_enabled: res.data.smart_cache_enabled,
          smart_cache_ttl_hours: res.data.smart_cache_ttl_hours,
          upstream_timeout_sec: res.data.upstream_timeout_sec,
          fallback_provider_enabled: res.data.fallback_provider_enabled,
          rate_limit_per_min: res.data.rate_limit_per_min,
          low_balance_alert_threshold: res.data.low_balance_alert_threshold,
          webhook_notification_url: res.data.webhook_notification_url || '',
        });
      }
    } catch (err) {
      console.warn('Lỗi tải cấu hình hệ thống:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleFlushCache = async () => {
    const ok = await alert.confirm({
      title: 'Dọn Dẹp Bộ Nhớ Smart Cache',
      text: 'Xác nhận giải phóng toàn bộ khóa cache trên bộ nhớ đệm RAM? Các ảnh tạo sau đó sẽ gọi trực tiếp nhà cung cấp cho tới khi cache mới được tích lũy.',
      confirmButtonText: 'Dọn dẹp ngay',
      cancelButtonText: 'Hủy bỏ',
    });
    if (ok) {
      setIsFlushing(true);
      try {
        await toolsApi.flushCache();
        loadConfig();
      } catch (err: any) {
        alert.error('Lỗi khi dọn dẹp cache', err?.message);
      } finally {
        setIsFlushing(false);
      }
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await toolsApi.updateConfig(formData);
      loadConfig();
    } catch (err: any) {
      alert.error('Cập nhật cấu hình thất bại', err?.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Cài Đặt Công Cụ & AI Gateway</h1>
            <span className="text-xs bg-brand-50 text-brand-600 px-2.5 py-0.5 rounded-full font-bold border border-brand-200">
              System Settings
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Điều phối bộ đệm Smart Cache, ngưỡng bảo vệ tài khoản, kết nối nhà cung cấp thượng nguồn và cảnh báo webhook.
          </p>
        </div>

        <Button
          variant="outline"
          size="md"
          leftIcon={<RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />}
          onClick={loadConfig}
        >
          Làm mới
        </Button>
      </div>

      {/* 1. Smart Cache Status Section */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Zap size={20} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>Bộ Đệm Phản Hồi Tức Thì (Smart Cache 25ms)</span>
                <Badge variant={config?.smart_cache_enabled ? 'success' : 'dark'}>
                  {config?.smart_cache_enabled ? 'Đang kích hoạt' : 'Tắt'}
                </Badge>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tự động phát hiện trùng prompt & tham số để trả kết quả 25ms, tiết kiệm 100% chi phí vốn NCC.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<Trash2 size={14} className="text-rose-500" />}
            onClick={handleFlushCache}
            disabled={isFlushing}
            className="border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold"
          >
            {isFlushing ? 'Đang dọn...' : 'Xóa toàn bộ Cache'}
          </Button>
        </div>

        {/* Cache Stat Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] text-slate-500 font-medium block">Số lượng bản ghi RAM</span>
            <span className="text-xl font-black text-slate-900 mt-0.5 block font-mono">
              {config?.smart_cache_entries ?? 0} keys
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] text-slate-500 font-medium block">Dung lượng bộ nhớ chiếm</span>
            <span className="text-xl font-black text-emerald-600 mt-0.5 block font-mono">
              {config?.smart_cache_size_mb ?? 0} MB
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] text-slate-500 font-medium block">Tỷ lệ Cache Hit trung bình</span>
            <span className="text-xl font-black text-brand-600 mt-0.5 block font-mono">
              {config?.cache_hit_rate_pct ?? 0}%
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] text-slate-500 font-medium block">Thời gian lưu trữ (TTL)</span>
            <span className="text-xl font-black text-slate-900 mt-0.5 block font-mono">
              {config?.smart_cache_ttl_hours ?? 168} giờ
            </span>
          </div>
        </div>
      </div>

      {/* 2. Upstream Gateway & Reliability */}
      <form onSubmit={handleSaveConfig} className="space-y-6">
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Server size={20} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Điều Phối Nhà Cung Cấp & Chống Nghẽn Mạng
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Cấu hình cụm xử lý sinh ảnh AI thượng nguồn và node dự phòng tự động khi có lỗi mạng.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <span className="font-bold text-slate-800 block text-xs">Nhà cung cấp chính (Primary Upstream)</span>
              <p className="text-slate-600 font-medium">{config?.upstream_provider_name}</p>
              <span className="text-[11px] font-mono text-slate-400 block">{config?.upstream_endpoint}</span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <span className="font-bold text-slate-800 block text-xs">Node dự phòng (Failover Engine)</span>
              <p className="text-slate-600 font-medium">{config?.fallback_provider_name}</p>
              <label className="inline-flex items-center gap-2 font-medium cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={formData.fallback_provider_enabled ?? true}
                  onChange={(e) => setFormData((p) => ({ ...p, fallback_provider_enabled: e.target.checked }))}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                />
                <span className="text-xs">Tự động chuyển node khi Primary gặp lỗi 5xx</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Thời gian chờ tối đa (Timeout giây)"
              type="number"
              value={formData.upstream_timeout_sec ?? 60}
              onChange={(e) => setFormData((p) => ({ ...p, upstream_timeout_sec: Number(e.target.value) }))}
            />
            <Input
              label="Hạn mức Rate Limit Cổng Khách (req/min)"
              type="number"
              value={formData.rate_limit_per_min ?? 120}
              onChange={(e) => setFormData((p) => ({ ...p, rate_limit_per_min: Number(e.target.value) }))}
            />
            <Input
              label="Ngưỡng cảnh báo ví cạn tiền (VNĐ)"
              type="number"
              value={formData.low_balance_alert_threshold ?? 50000}
              onChange={(e) => setFormData((p) => ({ ...p, low_balance_alert_threshold: Number(e.target.value) }))}
            />
          </div>

          <Input
            label="Webhook URL nhận thông báo sự cố & cạn ví"
            type="url"
            placeholder="https://your-domain.com/webhook/alerts"
            value={formData.webhook_notification_url ?? ''}
            onChange={(e) => setFormData((p) => ({ ...p, webhook_notification_url: e.target.value }))}
          />

          <div className="pt-2 flex justify-end">
            <Button variant="primary" size="md" type="submit" isLoading={isSaving}>
              Lưu Cấu Hình Vận Hành
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
