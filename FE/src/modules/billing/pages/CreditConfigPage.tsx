import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Save, DollarSign, Gift, AlertTriangle } from 'lucide-react';
import { Button } from '../../../core/components/Button/Button';
import { Input } from '../../../core/components/Input/Input';
import { alert } from '../../../core/alert';
import { billingApi } from '../api';
import type { CreditConfigItem } from '../types';

export const CreditConfigPage: React.FC = () => {
  const [formData, setFormData] = useState<CreditConfigItem>({
    min_deposit_amount: 50000,
    max_deposit_amount: 50000000,
    credit_exchange_rate: 1.0,
    low_balance_warning_threshold: 30000,
    bonus_tier_1_threshold: 1000000,
    bonus_tier_1_pct: 5,
    bonus_tier_2_threshold: 3000000,
    bonus_tier_2_pct: 10,
    auto_reconcile_sepay: true,
    allow_negative_balance: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await billingApi.getCreditConfig();
      if (res.success && res.data) {
        setFormData(res.data);
      }
    } catch (err) {
      console.warn('Lỗi tải cấu hình credit:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Giả lập lưu cấu hình và thông báo thành công
      await new Promise((r) => setTimeout(r, 400));
      alert.toast('Cập nhật chính sách Credit & Ví thành công!', 'success');
    } catch (err: any) {
      alert.error('Lỗi khi lưu cấu hình', err?.message);
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
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Cấu Hình Credit & Chính Sách Ví</h1>
            <span className="text-xs bg-brand-50 text-brand-600 px-2.5 py-0.5 rounded-full font-bold border border-brand-200">
              Wallet Policies
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Thiết lập hạn mức giao dịch tối thiểu/tối đa, tỷ lệ quy đổi số dư và quy tắc thưởng khuyến mại nạp lớn.
          </p>
        </div>

        <Button
          variant="outline"
          size="md"
          leftIcon={<RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />}
          onClick={loadData}
        >
          Làm mới
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Deposit Limits */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-brand-600 flex items-center justify-center">
              <DollarSign size={18} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Hạn Mức Nạp Tiền & Quy Đổi</h2>
              <p className="text-xs text-slate-500">Giới hạn số tiền nạp trong mỗi phiên thanh toán VietQR/SePay</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Mức nạp tối thiểu (VNĐ)"
              type="number"
              value={formData.min_deposit_amount}
              onChange={(e) => setFormData((p) => ({ ...p, min_deposit_amount: Number(e.target.value) }))}
              required
            />
            <Input
              label="Mức nạp tối đa 1 lần (VNĐ)"
              type="number"
              value={formData.max_deposit_amount}
              onChange={(e) => setFormData((p) => ({ ...p, max_deposit_amount: Number(e.target.value) }))}
              required
            />
            <Input
              label="Tỷ lệ quy đổi (1 VNĐ = X Credit)"
              type="number"
              step="0.1"
              value={formData.credit_exchange_rate}
              onChange={(e) => setFormData((p) => ({ ...p, credit_exchange_rate: Number(e.target.value) }))}
              required
            />
          </div>
        </div>

        {/* 2. Bonus Tiers */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Gift size={18} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Khuyến Mại & Tặng Kèm Credit</h2>
              <p className="text-xs text-slate-500">Cộng thêm phần trăm giá trị tín dụng khi nạp các mốc lớn</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <span className="font-bold text-xs text-slate-800">Mốc Thưởng Cấp 1 (Phổ biến)</span>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Từ số tiền (VNĐ)"
                  type="number"
                  value={formData.bonus_tier_1_threshold}
                  onChange={(e) => setFormData((p) => ({ ...p, bonus_tier_1_threshold: Number(e.target.value) }))}
                />
                <Input
                  label="Tặng thêm (%)"
                  type="number"
                  value={formData.bonus_tier_1_pct}
                  onChange={(e) => setFormData((p) => ({ ...p, bonus_tier_1_pct: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <span className="font-bold text-xs text-slate-800">Mốc Thưởng Cấp 2 (Doanh nghiệp)</span>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Từ số tiền (VNĐ)"
                  type="number"
                  value={formData.bonus_tier_2_threshold}
                  onChange={(e) => setFormData((p) => ({ ...p, bonus_tier_2_threshold: Number(e.target.value) }))}
                />
                <Input
                  label="Tặng thêm (%)"
                  type="number"
                  value={formData.bonus_tier_2_pct}
                  onChange={(e) => setFormData((p) => ({ ...p, bonus_tier_2_pct: Number(e.target.value) }))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Safety & Notifications */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">An Toàn Tài Khoản & Cảnh Báo</h2>
              <p className="text-xs text-slate-500">Bảo vệ gián đoạn dịch vụ tạo ảnh khi số dư sắp hết</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Ngưỡng cảnh báo số dư thấp (VNĐ)"
              type="number"
              value={formData.low_balance_warning_threshold}
              onChange={(e) =>
                setFormData((p) => ({ ...p, low_balance_warning_threshold: Number(e.target.value) }))
              }
            />

            <div className="flex flex-col justify-center space-y-2 pt-4">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-xs">
                <input
                  type="checkbox"
                  checked={formData.auto_reconcile_sepay}
                  onChange={(e) => setFormData((p) => ({ ...p, auto_reconcile_sepay: e.target.checked }))}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                />
                <span>Tự động kích hoạt nạp SePay 24/7 không cần phê duyệt thủ công</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-xs text-slate-500">
                <input
                  type="checkbox"
                  checked={formData.allow_negative_balance}
                  onChange={(e) => setFormData((p) => ({ ...p, allow_negative_balance: e.target.checked }))}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                />
                <span>Cho phép số dư âm (Ghi nợ tạm thời cho khách hàng VIP)</span>
              </label>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <Button variant="primary" size="md" type="submit" isLoading={isSaving} leftIcon={<Save size={15} />}>
              Lưu Chính Sách Ví
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
