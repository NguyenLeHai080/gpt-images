import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Building2, QrCode, Copy, Check, RefreshCw, AlertCircle, Download, Zap } from 'lucide-react';
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

  // VietQR Optimization & Features
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [isQrImgLoading, setIsQrImgLoading] = useState(true);
  const [qrTemplate, setQrTemplate] = useState<'compact2' | 'qr_only'>('compact2');

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

  const transferMemo = selectedBank?.transfer_memo || `SEVQR GPT ${user?.id || 'user_admin_01'}`;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    alert.toast(`Đã sao chép ${label}: ${text}`, 'success');
    setTimeout(() => setCopiedField(null), 2000);
  };

  // URL VietQR API: Sử dụng official CDN img.vietqr.io với Cloudflare Edge Caching (< 0.5s)
  const qrUrl = useMemo(() => {
    if (!selectedBank) return '';
    const bankCode = selectedBank.bank_code === 'ICB' ? 'vietinbank' : (selectedBank.bank_code || 'vietinbank').toLowerCase();
    const acc = selectedBank.account_number;
    const memo = encodeURIComponent(transferMemo);
    const holder = encodeURIComponent(selectedBank.account_holder);
    const amountParam = selectedAmount ? `&amount=${selectedAmount}` : '';

    return `https://img.vietqr.io/image/${bankCode}-${acc}-${qrTemplate}.png?addInfo=${memo}&accountName=${holder}${amountParam}`;
  }, [selectedBank, transferMemo, selectedAmount, qrTemplate]);

  useEffect(() => {
    if (qrUrl) {
      setIsQrImgLoading(true);
    }
  }, [qrUrl]);

  const handleDownloadQR = async () => {
    if (!qrUrl) return;
    try {
      alert.toast('Đang tải hình ảnh mã VietQR...', 'info');
      const res = await fetch(qrUrl);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `VietQR_${selectedBank?.account_number}_${transferMemo.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      alert.toast('Đã tải ảnh mã VietQR thành công!', 'success');
    } catch (err) {
      window.open(qrUrl, '_blank');
    }
  };

  const amountPresets = [
    { label: '50.000đ', value: 50000 },
    { label: '100.000đ', value: 100000 },
    { label: '200.000đ', value: 200000 },
    { label: '500.000đ', value: 500000 },
  ];

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Tài Khoản Ngân Hàng & Mã QR Nạp Tiền</h1>
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold border border-emerald-200 flex items-center gap-1">
              <Zap size={12} className="text-emerald-500 fill-emerald-500" />
              VietQR Siêu Tốc 24/7
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Thông tin chuyển khoản ngân hàng doanh nghiệp và mã VietQR tự động điền cú pháp nạp tiền qua SePay Webhook.
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
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <QrCode size={18} className="text-brand-500" />
              <h3 className="font-extrabold text-sm text-slate-900">Mã VietQR Tự Động</h3>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
              <Zap size={10} /> CDN &lt; 0.5s
            </span>
          </div>

          {selectedBank && qrUrl ? (
            <div className="space-y-4">
              {/* Preset quick amounts */}
              <div className="text-left space-y-1.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Chọn nhanh số tiền nạp:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedAmount(null)}
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                      selectedAmount === null
                        ? 'bg-brand-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Tùy chọn
                  </button>
                  {amountPresets.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setSelectedAmount(p.value)}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                        selectedAmount === p.value
                          ? 'bg-brand-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* QR Image Container with Shimmer Loading */}
              <div className="relative p-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 shadow-2xs min-h-[260px] flex items-center justify-center overflow-hidden">
                {isQrImgLoading && (
                  <div className="absolute inset-0 z-10 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center p-4 space-y-2.5 animate-pulse">
                    <RefreshCw size={24} className="text-brand-500 animate-spin" />
                    <span className="text-xs font-bold text-slate-600">Đang tải mã VietQR siêu tốc...</span>
                    <span className="text-[10px] text-slate-400">Napas 247 Cloudflare Edge</span>
                  </div>
                )}
                <img
                  key={qrUrl}
                  src={qrUrl}
                  alt="VietQR nạp tiền"
                  onLoad={() => setIsQrImgLoading(false)}
                  onError={() => setIsQrImgLoading(false)}
                  className={`w-60 h-auto object-contain mx-auto rounded-xl transition-all duration-300 ${
                    isQrImgLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                  }`}
                />
              </div>

              {/* Action Buttons: Template toggle & Download */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px]">
                  <button
                    type="button"
                    onClick={() => setQrTemplate('compact2')}
                    className={`px-2 py-1 rounded-md font-semibold transition-all ${
                      qrTemplate === 'compact2' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    Khung chuẩn
                  </button>
                  <button
                    type="button"
                    onClick={() => setQrTemplate('qr_only')}
                    className={`px-2 py-1 rounded-md font-semibold transition-all ${
                      qrTemplate === 'qr_only' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    Chỉ mã QR
                  </button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Download size={13} />}
                  onClick={handleDownloadQR}
                  className="text-xs"
                >
                  Tải QR
                </Button>
              </div>

              {/* Account Details Box */}
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

                {selectedAmount && (
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Số tiền:</span>
                    <span className="font-bold text-emerald-600 text-xs">{selectedAmount.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}

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
