import React, { useState, useEffect, useCallback } from 'react';
import { Building2, QrCode, Copy, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '../../../core/components/Button/Button';
import { Badge } from '../../../core/components/Badge/Badge';
import { alert } from '../../../core/alert';
import { useAuth } from '../../../core/hooks/useAuth';
import { billingApi } from '../api';
import type { BankAccountItem } from '../types';

export const BankingConfigPage: React.FC = () => {
  const { user } = useAuth();
  const [bankAccounts, setBankAccounts] = useState<BankAccountItem[]>([]);
  const [selectedBank, setSelectedBank] = useState<BankAccountItem | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await billingApi.getBankAccounts();
      if (res.success && res.data && res.data.length > 0) {
        setBankAccounts(res.data);
        setSelectedBank(res.data.find((b) => b.is_primary) || res.data[0]);
      }
    } catch (err) {
      console.warn('Lỗi tải tài khoản ngân hàng:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const transferMemo = `GPT ${user?.id || 'user_admin_01'}`;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    alert.toast(`Đã sao chép ${label}: ${text}`, 'success');
    setTimeout(() => setCopiedField(null), 2000);
  };

  // URL VietQR API
  const qrUrl = selectedBank?.qr_url
    ? selectedBank.qr_url
    : (selectedBank
      ? `https://vietqr.app/img?bank=VietinBank&acc=${selectedBank.account_number}&template=compact&des=${encodeURIComponent(
          transferMemo
        )}&showinfo=true&holder=${encodeURIComponent(selectedBank.account_holder)}`
      : '');

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Tài Khoản Ngân Hàng & Mã QR Nạp Tiền</h1>
            <span className="text-xs bg-brand-50 text-brand-600 px-2.5 py-0.5 rounded-full font-bold border border-brand-200">
              VietQR 24/7
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Thông tin chuyển khoản ngân hàng doanh nghiệp và mã QR tự động điền cú pháp nạp tín dụng vào ví tài khoản.
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left: Bank Accounts List (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Building2 size={16} className="text-brand-500" />
            <span>Danh Sách Ngân Hàng Thụ Hưởng Doanh Nghiệp</span>
          </h2>

          <div className="space-y-3">
            {bankAccounts.map((acc) => {
              const isSelected = selectedBank?.id === acc.id;
              return (
                <div
                  key={acc.id}
                  onClick={() => setSelectedBank(acc)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 hover-lift ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50/40 ring-2 ring-brand-500/20 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">{acc.bank_name}</span>
                        {acc.is_primary && (
                          <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-brand-500 text-white">
                            MẶC ĐỊNH
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{acc.branch}</p>
                    </div>
                    <Badge variant={acc.is_active ? 'success' : 'dark'}>
                      {acc.is_active ? 'Đang hoạt động' : 'Tạm dừng'}
                    </Badge>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block font-medium text-[11px]">Số tài khoản</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono font-black text-sm text-slate-900 tracking-wider">
                          {acc.account_number}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(acc.account_number, 'Số tài khoản');
                          }}
                          className="text-slate-400 hover:text-brand-600 p-1"
                          title="Sao chép số tài khoản"
                        >
                          {copiedField === 'Số tài khoản' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-medium text-[11px]">Chủ tài khoản</span>
                      <span className="font-bold text-xs text-slate-800 uppercase block mt-0.5">
                        {acc.account_holder}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Transfer Instruction Alert Card */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-800">
              <AlertCircle size={16} className="text-amber-600 shrink-0" />
              <span>Lưu Ý Quan Trọng Khi Nạp Tiền:</span>
            </div>
            <p className="leading-relaxed">
              Vui lòng giữ nguyên <strong>Mã cú pháp chuyển khoản</strong> ({transferMemo}) trong nội dung chuyển tiền.
              Hệ thống SePay sẽ tự động đối soát và cộng tín dụng vào tài khoản của bạn trong vòng <strong>30 giây đến 1 phút</strong> sau khi ngân hàng xử lý thành công.
            </p>
          </div>
        </div>

        {/* Right: VietQR Code Generator Card (1 Col) */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 text-center">
          <div className="flex items-center justify-center gap-2 pb-2 border-b border-slate-100">
            <QrCode size={18} className="text-brand-500" />
            <h3 className="font-extrabold text-sm text-slate-900">Mã VietQR Tự Động</h3>
          </div>

          {selectedBank && qrUrl ? (
            <div className="space-y-3">
              <div className="p-2 rounded-xl border border-slate-200 bg-slate-50 inline-block shadow-2xs">
                <img
                  src={qrUrl}
                  alt="VietQR nạp tiền"
                  className="w-56 h-56 object-contain mx-auto rounded-lg"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Cú pháp nạp:</span>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="font-mono font-black text-brand-600 text-xs">{transferMemo}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(transferMemo, 'Cú pháp')}
                      className="text-xs text-slate-500 hover:text-brand-600 font-semibold flex items-center gap-1"
                    >
                      {copiedField === 'Cú pháp' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      <span>Chép</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                  <span>Ngân hàng: <strong>{selectedBank.bank_name}</strong></span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-8">Chọn tài khoản ngân hàng để tạo mã QR</p>
          )}
        </div>
      </div>
    </div>
  );
};
