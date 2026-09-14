import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, DollarSign, Zap, Save } from 'lucide-react';
import { Modal } from '../../../core/components/Modal/Modal';
import { Button } from '../../../core/components/Button/Button';
import { alert } from '../../../core/alert';
import { pricingApi } from '../api';
import type { ModelPricingItem } from '../types';

interface EditModelPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ModelPricingItem | null;
  onSuccess: (updated: ModelPricingItem) => void;
}

export const EditModelPricingModal: React.FC<EditModelPricingModalProps> = ({
  isOpen,
  onClose,
  item,
  onSuccess,
}) => {
  const [providerCost, setProviderCost] = useState<number>(120);
  const [basePrice, setBasePrice] = useState<number>(150);
  const [tokenRate, setTokenRate] = useState<number>(1024);
  const [status, setStatus] = useState<string>('ACTIVE');
  const [displayName, setDisplayName] = useState<string>('');
  const [provider, setProvider] = useState<string>('Nexora AI Core');
  const [latencyRange, setLatencyRange] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setProviderCost(item.provider_cost ?? 120);
      setBasePrice(item.base_price ?? 150);
      setTokenRate(item.token_rate ?? 1024);
      setStatus(item.status || 'ACTIVE');
      setDisplayName(item.display_name || '');
      setProvider(item.provider || 'Nexora AI Core');
      setLatencyRange(item.latency_range || '25ms (Cache) - 3.2s (Gen)');
      setDescription(item.description || '');
    }
  }, [item]);

  if (!isOpen || !item) return null;

  // Realtime Profit & Margin Calculations
  const profitPerReq = basePrice - providerCost;
  const marginPct = basePrice > 0 ? (profitPerReq / basePrice) * 100 : 0;
  const isProfitable = profitPerReq > 0;
  const isLoss = profitPerReq < 0;

  // Projection for 10,000 requests (35% smart cache hit)
  const projCount = 10000;
  const cacheMissCount = 6500;
  const projRevenue = projCount * basePrice;
  const projProviderCost = cacheMissCount * providerCost;
  const projGrossProfit = projRevenue - projProviderCost;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (basePrice <= 0) {
      alert.toast('Giá bán API phải lớn hơn 0đ', 'warning');
      return;
    }
    if (providerCost < 0) {
      alert.toast('Chi phí nhà cung cấp không hợp lệ', 'warning');
      return;
    }

    if (isLoss) {
      const confirmProceed = await alert.confirm({
        title: 'Cảnh Báo Thiết Lập Giá Lỗ',
        text: `Giá bán (${basePrice.toLocaleString()}đ) đang THẤP HƠN chi phí NCC (${providerCost.toLocaleString()}đ). Bạn có chắc chắn muốn áp dụng mức giá này?`,
        confirmButtonText: 'Vẫn áp dụng',
        cancelButtonText: 'Xem lại giá',
        isDanger: true,
      });
      if (!confirmProceed) return;
    }

    setIsSubmitting(true);
    try {
      const res = await pricingApi.updateModelPricing(item.model, {
        provider_cost: Number(providerCost),
        base_price: Number(basePrice),
        token_rate: Number(tokenRate),
        status,
        display_name: displayName.trim(),
        provider: provider.trim(),
        latency_range: latencyRange.trim(),
        description: description.trim(),
      });

      if (res.success && res.data) {
        alert.toast(`Đã cập nhật bảng giá cho ${item.model}!`, 'success');
        onSuccess(res.data);
        onClose();
      } else {
        alert.error('Cập nhật thất bại', res.message || 'Vui lòng kiểm tra lại');
      }
    } catch (err: any) {
      alert.error('Lỗi kết nối', err?.message || 'Không thể cập nhật bảng giá');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isSubmitting && onClose()}
      size="lg"
      title={
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-base font-bold text-slate-900">
            Cấu Hình Giá API & Phân Tích Lời Lỗ
          </span>
          <span className="pricing-badge-model">{item.model}</span>
        </div>
      }
      description={`Thiết lập chi phí vốn nhà cung cấp (${item.provider}), giá niêm yết thu khách và tỷ lệ token.`}
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            leftIcon={<Save size={16} />}
            onClick={() => handleSubmit()}
          >
            Lưu & Áp Dụng Bảng Giá
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Display Name & Provider */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="pricing-form-group">
            <div className="pricing-form-group__header">
              <label className="pricing-form-group__label">
                Tên hiển thị <span className="pricing-form-group__required">*</span>
              </label>
            </div>
            <div className="pricing-form-group__control">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                placeholder="VD: GPT Image 2 Enterprise"
                className="pricing-form-group__input"
              />
            </div>
          </div>

          <div className="pricing-form-group">
            <div className="pricing-form-group__header">
              <label className="pricing-form-group__label">
                Nhà cung cấp <span className="pricing-form-group__required">*</span>
              </label>
            </div>
            <div className="pricing-form-group__control">
              <input
                type="text"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                required
                placeholder="VD: Nexora AI Core"
                className="pricing-form-group__input"
              />
            </div>
          </div>
        </div>

        {/* Main Pricing & Token Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Input 1: Provider Cost */}
          <div className="pricing-form-group">
            <div className="pricing-form-group__header">
              <label className="pricing-form-group__label">Chi phí NCC (Giá vốn)</label>
              <span className="pricing-form-group__unit">VND / ảnh</span>
            </div>
            <div className="pricing-form-group__control">
              <input
                type="number"
                min="0"
                step="1"
                value={providerCost}
                onChange={(e) => setProviderCost(Number(e.target.value))}
                required
                className="pricing-form-group__input pricing-form-group__input--has-suffix"
              />
              <span className="pricing-form-group__suffix">đ</span>
            </div>
          </div>

          {/* Input 2: Base Selling Price (Highlighted) */}
          <div className="pricing-form-group">
            <div className="pricing-form-group__header">
              <label className="pricing-form-group__label">Giá bán API (Thu khách)</label>
              <span className="pricing-form-group__unit pricing-form-group__unit--highlight">
                VND / ảnh
              </span>
            </div>
            <div className="pricing-form-group__control">
              <input
                type="number"
                min="1"
                step="1"
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
                required
                className="pricing-form-group__input pricing-form-group__input--has-suffix pricing-form-group__input--highlight"
              />
              <span className="pricing-form-group__suffix pricing-form-group__suffix--highlight">
                đ
              </span>
            </div>
          </div>

          {/* Input 3: Token Rate */}
          <div className="pricing-form-group">
            <div className="pricing-form-group__header">
              <label className="pricing-form-group__label">Quy đổi Token / lượt gọi</label>
              <span className="pricing-form-group__unit">Tokens</span>
            </div>
            <div className="pricing-form-group__control">
              <input
                type="number"
                min="1"
                step="1"
                value={tokenRate}
                onChange={(e) => setTokenRate(Number(e.target.value))}
                required
                className="pricing-form-group__input pricing-form-group__input--has-suffix-lg"
              />
              <span className="pricing-form-group__suffix">tokens</span>
            </div>
          </div>

          {/* Input 4: Status */}
          <div className="pricing-form-group">
            <div className="pricing-form-group__header">
              <label className="pricing-form-group__label">Trạng thái phát hành</label>
            </div>
            <div className="pricing-form-group__control">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="pricing-form-group__select"
              >
                <option value="ACTIVE">Đang hoạt động (Kinh doanh)</option>
                <option value="MAINTENANCE">Bảo trì tạm thời (Chặn gọi)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Latency & Description */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="pricing-form-group">
            <div className="pricing-form-group__header">
              <label className="pricing-form-group__label">Độ trễ xử lý (Latency)</label>
            </div>
            <div className="pricing-form-group__control">
              <input
                type="text"
                value={latencyRange}
                onChange={(e) => setLatencyRange(e.target.value)}
                placeholder="VD: 25ms (Cache) - 3.2s (Gen)"
                className="pricing-form-group__input"
              />
            </div>
          </div>

          <div className="pricing-form-group">
            <div className="pricing-form-group__header">
              <label className="pricing-form-group__label">Mô tả chi tiết</label>
            </div>
            <div className="pricing-form-group__control">
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="VD: Mô hình thế hệ mới..."
                className="pricing-form-group__input"
              />
            </div>
          </div>
        </div>

        {/* Realtime PnL Card Widget */}
        <div
          className={`pricing-pnl ${
            isProfitable
              ? 'pricing-pnl--profitable'
              : isLoss
              ? 'pricing-pnl--loss'
              : 'pricing-pnl--neutral'
          }`}
        >
          <div className="pricing-pnl__header">
            <div className="pricing-pnl__title">
              {isProfitable ? (
                <CheckCircle2 size={17} className="text-emerald-600 shrink-0" />
              ) : isLoss ? (
                <AlertTriangle size={17} className="text-rose-600 shrink-0" />
              ) : (
                <DollarSign size={17} className="text-slate-500 shrink-0" />
              )}
              <span>Kết Quả Phân Tích Lời / Lỗ Trên Mỗi Request</span>
            </div>

            <span
              className={`pricing-pnl__badge ${
                isProfitable
                  ? 'pricing-pnl__badge--profitable'
                  : isLoss
                  ? 'pricing-pnl__badge--loss'
                  : 'pricing-pnl__badge--neutral'
              }`}
            >
              {isProfitable
                ? `Lãi +${Math.round(profitPerReq).toLocaleString()}đ (${marginPct.toFixed(1)}%)`
                : isLoss
                ? `Lỗ ${Math.round(profitPerReq).toLocaleString()}đ (${marginPct.toFixed(1)}%)`
                : 'Hòa vốn 0đ (0%)'}
            </span>
          </div>

          <div className="pricing-pnl__grid">
            <div className="pricing-pnl__stat">
              <span className="pricing-pnl__stat-label">Giá vốn NCC</span>
              <span className="pricing-pnl__stat-value">
                {providerCost.toLocaleString()}đ
              </span>
            </div>

            <div className="pricing-pnl__stat">
              <span className="pricing-pnl__stat-label">Giá bán khách</span>
              <span className="pricing-pnl__stat-value pricing-pnl__stat-value--primary">
                {basePrice.toLocaleString()}đ
              </span>
            </div>

            <div className="pricing-pnl__stat">
              <span className="pricing-pnl__stat-label">Lợi nhuận gộp</span>
              <span
                className={`pricing-pnl__stat-value ${
                  isProfitable
                    ? 'pricing-pnl__stat-value--success'
                    : isLoss
                    ? 'pricing-pnl__stat-value--danger'
                    : ''
                }`}
              >
                {profitPerReq >= 0
                  ? `+${Math.round(profitPerReq).toLocaleString()}đ`
                  : `${Math.round(profitPerReq).toLocaleString()}đ`}
              </span>
            </div>
          </div>

          {/* Smart Cache Projection */}
          <div className="pricing-pnl__cache-row">
            <div className="pricing-pnl__cache-label">
              <Zap size={15} className="text-amber-500 shrink-0" />
              <span>Kịch bản 10.000 ảnh (Cache 35%):</span>
            </div>
            <div className="pricing-pnl__cache-result">
              Thu <strong className="text-brand-600">{projRevenue.toLocaleString()}đ</strong> / Lãi ròng{' '}
              <strong className={projGrossProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                {projGrossProfit >= 0
                  ? `+${projGrossProfit.toLocaleString()}đ`
                  : `${projGrossProfit.toLocaleString()}đ`}
              </strong>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};
