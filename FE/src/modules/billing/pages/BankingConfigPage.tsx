import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Building2,
  QrCode,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  Download,
  Zap,
  PlusCircle,
  History,
  TrendingUp,
  Cpu,
  Trash2,
  ShieldCheck,
  Wallet,
  Sparkles,
  Activity,
} from 'lucide-react';
import { Button } from '../../../core/components/Button/Button';
import { Badge } from '../../../core/components/Badge/Badge';
import { Modal } from '../../../core/components/Modal/Modal';
import { alert } from '../../../core/alert';
import { useAuth } from '../../../core/hooks/useAuth';
import { billingApi } from '../api';
import type { BankAccountItem, ProviderBudgetOverview } from '../types';

export const BankingConfigPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  // Tabs: 'sepay_qr' (Tất cả) | 'provider_budget' (Chỉ Super Admin / Admin)
  const [activeTab, setActiveTab] = useState<'sepay_qr' | 'provider_budget'>('sepay_qr');

  // VietQR & Bank Accounts state
  const [bankAccounts, setBankAccounts] = useState<BankAccountItem[]>([]);
  const [selectedBank, setSelectedBank] = useState<BankAccountItem | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [isQrImgLoading, setIsQrImgLoading] = useState(true);
  const [qrTemplate, setQrTemplate] = useState<'compact2' | 'qr_only'>('compact2');

  // Super Admin QuotaGuard Budget state
  const [budgetOverview, setBudgetOverview] = useState<ProviderBudgetOverview | null>(null);
  const [isBudgetLoading, setIsBudgetLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState<number>(100000);
  const [topupNote, setTopupNote] = useState<string>('Nạp ngân sách NCC qua VietQR');
  const [isSubmittingTopup, setIsSubmittingTopup] = useState(false);

  // Load Bank Accounts for SePay QR
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

  // Load Provider QuotaGuard Budget (Super Admin only)
  const loadBudgetData = useCallback(async () => {
    if (!isAdmin) return;
    setIsBudgetLoading(true);
    try {
      const res = await billingApi.getProviderBudget();
      if (res.success && res.data) {
        setBudgetOverview(res.data);
      }
    } catch (err) {
      console.warn('Lỗi tải ngân sách NCC:', err);
    } finally {
      setIsBudgetLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadData();
    if (isAdmin) {
      loadBudgetData();
    }
  }, [loadData, loadBudgetData, isAdmin]);

  const transferMemo = selectedBank?.transfer_memo || `SEVQR GPT ${user?.id || 'user_admin_01'}`;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    alert.toast(`Đã sao chép ${label}: ${text}`, 'success');
    setTimeout(() => setCopiedField(null), 2000);
  };

  // VietQR URL Generator
  const qrUrl = useMemo(() => {
    if (!selectedBank) return '';
    const bankCode =
      selectedBank.bank_code === 'ICB'
        ? 'vietinbank'
        : (selectedBank.bank_code || 'vietinbank').toLowerCase();
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
    } catch {
      window.open(qrUrl, '_blank');
    }
  };

  // Sync Provider Quota Live
  const handleSyncBudget = async () => {
    setIsSyncing(true);
    try {
      const res = await billingApi.syncProviderBudget();
      if (res.success && res.data) {
        setBudgetOverview(res.data);
      }
    } catch {
      alert.toast('Lỗi khi đồng bộ QuotaGuard', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Top-up Budget Submit
  const handleTopupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (topupAmount <= 0) {
      alert.toast('Vui lòng nhập số tiền hợp lệ (> 0đ)', 'error');
      return;
    }
    setIsSubmittingTopup(true);
    try {
      const res = await billingApi.topupProviderBudget({
        amount: topupAmount,
        note: topupNote,
      });
      if (res.success && res.data) {
        setBudgetOverview(res.data);
        setIsTopupModalOpen(false);
        setTopupNote('Nạp ngân sách NCC qua VietQR');
      }
    } catch {
      alert.toast('Lỗi khi ghi nhận nạp ngân sách', 'error');
    } finally {
      setIsSubmittingTopup(false);
    }
  };

  // Clear all provider budget logs & reset to baseline 100,000 VND
  const handleClearAllLogs = async () => {
    const confirmed = window.confirm(
      'Bạn có chắc chắn muốn xoá toàn bộ lịch sử nạp ngân sách và reset hạn mức về mức gốc 100.000 đ?'
    );
    if (!confirmed) return;
    try {
      const res = await billingApi.clearProviderBudgetLogs();
      if (res.success && res.data) {
        setBudgetOverview(res.data);
        alert.toast('Đã xoá sạch lịch sử nạp và reset ngân sách về 100.000 đ', 'success');
      }
    } catch {
      alert.toast('Lỗi khi xoá dữ liệu lịch sử nạp', 'error');
    }
  };

  // Delete single provider budget log
  const handleDeleteLog = async (logId: string) => {
    const confirmed = window.confirm(`Bạn có chắc chắn muốn xoá bản ghi nạp ${logId}?`);
    if (!confirmed) return;
    try {
      const res = await billingApi.deleteProviderBudgetLog(logId);
      if (res.success && res.data) {
        setBudgetOverview(res.data);
        alert.toast(`Đã xoá bản ghi ${logId}`, 'success');
      }
    } catch {
      alert.toast('Lỗi khi xoá bản ghi', 'error');
    }
  };


  const amountPresets = [
    { label: '50.000đ', value: 50000 },
    { label: '100.000đ', value: 100000 },
    { label: '200.000đ', value: 200000 },
    { label: '500.000đ', value: 500000 },
  ];

  const quickTopupPresets = [
    { label: '+100.000đ', value: 100000 },
    { label: '+200.000đ', value: 200000 },
    { label: '+500.000đ', value: 500000 },
    { label: '+1.000.000đ', value: 1000000 },
  ];

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {activeTab === 'sepay_qr'
                ? 'Tài Khoản Ngân Hàng & Mã QR Nạp Tiền'
                : 'Quản Trị Ngân Sách NCC & QuotaGuard Engine'}
            </h1>
            {activeTab === 'sepay_qr' ? (
              <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold border border-emerald-200 flex items-center gap-1">
                <Zap size={12} className="text-emerald-500 fill-emerald-500" />
                VietQR Siêu Tốc 24/7
              </span>
            ) : (
              <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full font-bold border border-amber-200 flex items-center gap-1">
                <Zap size={12} className="text-amber-500 fill-amber-500" />
                QuotaGuard Live Sync
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {activeTab === 'sepay_qr'
              ? 'Thông tin chuyển khoản ngân hàng doanh nghiệp và mã VietQR tự động điền cú pháp nạp tiền qua SePay Webhook.'
              : 'Dữ liệu ngân sách đồng bộ trực tiếp với cụm AI Gateway của Xompet (Khớp 1:1 với bot Telegram @TuanQuotaGuard_bot). Quản lý toàn bộ nạp tiền qua Web.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'provider_budget' && isAdmin && (
            <Button
              variant="primary"
              size="md"
              leftIcon={<PlusCircle size={15} />}
              onClick={() => setIsTopupModalOpen(true)}
            >
              Nạp Ngân Sách NCC
            </Button>
          )}
          <Button
            variant="outline"
            size="md"
            leftIcon={
              <RefreshCw
                size={15}
                className={isLoading || isBudgetLoading || isSyncing ? 'animate-spin' : ''}
              />
            }
            onClick={activeTab === 'sepay_qr' ? loadData : handleSyncBudget}
          >
            {activeTab === 'sepay_qr' ? 'Làm mới' : 'Đồng bộ Live'}
          </Button>
        </div>
      </div>

      {/* Role-Based Tab Switcher (Visible to Admins) */}
      {isAdmin && (
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('sepay_qr')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'sepay_qr'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <QrCode size={14} />
            <span>Mã VietQR Khách Hàng (SePay)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('provider_budget');
              if (!budgetOverview) loadBudgetData();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'provider_budget'
                ? 'bg-slate-900 text-white shadow-xs ring-2 ring-brand-500/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <Zap size={14} className="text-amber-400" />
            <span>Quản Trị Ngân Sách NCC & QuotaGuard</span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono font-bold">
              SUPER ADMIN
            </span>
          </button>
        </div>
      )}

      {/* TAB 1: SEPAY VIETQR DEPOSIT (FOR CUSTOMERS & ADMINS) */}
      {activeTab === 'sepay_qr' && (
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
                        ? 'border-brand-500 bg-brand-50/40 ring-2 ring-brand-500/20 shadow-xs'
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
                            {copiedField === 'Số tài khoản' ? (
                              <Check size={14} className="text-emerald-600" />
                            ) : (
                              <Copy size={14} />
                            )}
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
                Vui lòng giữ nguyên <strong>Mã cú pháp chuyển khoản</strong> ({transferMemo}) trong nội dung
                chuyển tiền. Hệ thống SePay sẽ tự động đối soát và cộng tín dụng vào tài khoản của bạn trong
                vòng <strong>30 giây đến 1 phút</strong> sau khi ngân hàng xử lý thành công.
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
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Chọn nhanh số tiền nạp:
                  </span>
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

                {/* QR Image Box */}
                <div className="relative mx-auto w-64 h-64 bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden flex items-center justify-center p-2 shadow-inner">
                  {isQrImgLoading && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-2xs flex flex-col items-center justify-center z-10">
                      <RefreshCw size={24} className="animate-spin text-brand-600 mb-2" />
                      <span className="text-xs text-slate-500 font-medium">Đang tạo mã VietQR...</span>
                    </div>
                  )}
                  <img
                    src={qrUrl}
                    alt="VietQR nạp tiền"
                    className="w-full h-full object-contain rounded-xl transition-opacity duration-300"
                    onLoad={() => setIsQrImgLoading(false)}
                    onError={() => setIsQrImgLoading(false)}
                  />
                </div>

                {/* Template Options & Action Buttons */}
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQrTemplate('compact2')}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                      qrTemplate === 'compact2'
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Bao gồm khung info
                  </button>
                  <button
                    type="button"
                    onClick={() => setQrTemplate('qr_only')}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                      qrTemplate === 'qr_only'
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Chỉ mã QR
                  </button>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Download size={13} />}
                    onClick={handleDownloadQR}
                    className="text-[11px] py-1"
                  >
                    Tải ảnh QR
                  </Button>
                </div>

                {/* Transfer Info Details */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-left space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Nội dung chuyển khoản (bắt buộc):
                    </span>
                    <div className="flex items-center justify-between mt-1 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                      <span className="font-mono font-black text-brand-600 text-sm tracking-wide">
                        {transferMemo}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(transferMemo, 'Nội dung chuyển khoản')}
                        className="text-slate-400 hover:text-brand-600 p-1"
                        title="Sao chép cú pháp"
                      >
                        {copiedField === 'Nội dung chuyển khoản' ? (
                          <Check size={14} className="text-emerald-600" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                  </div>

                  {selectedAmount && (
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Số tiền:</span>
                      <span className="font-bold text-emerald-600 text-xs">
                        {selectedAmount.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                    <span>
                      Ngân hàng: <strong>{selectedBank.bank_name}</strong>
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-8">Chọn tài khoản ngân hàng để tạo mã QR</p>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: QUOTAGUARD BUDGET & PROVIDER TOP-UP MANAGEMENT (SUPER ADMIN EXCLUSIVE) */}
      {activeTab === 'provider_budget' && isAdmin && (
        <div className="space-y-6">
          {/* Main QuotaGuard Control Center Card */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6 sm:p-7 text-white shadow-2xl space-y-6">
            {/* Ambient Background Glows */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-brand-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />

            {/* Header Status Bar */}
            <div className="relative z-10 flex flex-col gap-4 border-b border-slate-800/80 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3.5">
                <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <ShieldCheck size={24} />
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                  </span>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-extrabold text-slate-100 tracking-tight">
                      QuotaGuard AI Gateway
                    </h2>
                    <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black text-emerald-400 tracking-wider uppercase">
                      {budgetOverview?.status_text || 'Active • Bảo Vệ Ngân Sách'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="font-mono text-xs text-slate-300">
                      Key: {budgetOverview?.key_masked || 'Chưa cấu hình'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(budgetOverview?.key_masked || 'Chưa cấu hình', 'API Key')}
                      className="text-slate-400 hover:text-white transition-colors p-0.5"
                      title="Sao chép Key"
                    >
                      {copiedField === 'API Key' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    </button>
                    <span className="text-slate-600 hidden sm:inline">•</span>
                    <span className="text-xs text-slate-400">
                      Khớp 1:1 Telegram @TuanQuotaGuard_bot
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative z-10 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleSyncBudget}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-200 shadow-xs transition-all hover:bg-slate-700 hover:text-white disabled:opacity-50"
                  title="Đồng bộ lại từ AI Gateway"
                >
                  <RefreshCw size={13} className={isSyncing ? 'animate-spin text-amber-400' : ''} />
                  <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ Quota'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsTopupModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-brand-500/20 transition-all hover:brightness-110 active:scale-95"
                >
                  <PlusCircle size={14} />
                  <span>Nạp Ngân Sách Qua Web</span>
                </button>
              </div>
            </div>

            {/* 3 Metric Summary Cards */}
            <div className="relative z-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* Card 1: Total Budget */}
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4.5 backdrop-blur-md transition-all hover:border-white/[0.15]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Tổng Ngân Sách (Budget Total)
                  </span>
                  <div className="rounded-lg bg-indigo-500/10 p-1.5 text-indigo-400 border border-indigo-500/20">
                    <Wallet size={16} />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-mono font-black tracking-tight text-white">
                  {(budgetOverview?.budget_total ?? 0).toLocaleString('vi-VN')} đ
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                  <span>Đã cấu hình & quản lý trên Web</span>
                </div>
              </div>

              {/* Card 2: Used Budget */}
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4.5 backdrop-blur-md transition-all hover:border-white/[0.15]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Đã Sử Dụng (Budget Used)
                  </span>
                  <div className="rounded-lg bg-amber-500/10 p-1.5 text-amber-400 border border-amber-500/20">
                    <Activity size={16} />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-mono font-black tracking-tight text-amber-400">
                  {(budgetOverview?.budget_used ?? 0).toLocaleString('vi-VN')} đ
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-amber-300/80 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  <span>Đã tiêu thụ {budgetOverview?.used_percent ?? 0}% quota</span>
                </div>
              </div>

              {/* Card 3: Remaining Budget */}
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4.5 backdrop-blur-md transition-all hover:border-white/[0.15]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Còn Lại Khả Dụng (Remaining)
                  </span>
                  <div className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-400 border border-emerald-500/20">
                    <Sparkles size={16} />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-mono font-black tracking-tight text-emerald-400">
                  {(budgetOverview?.budget_remaining ?? 0).toLocaleString('vi-VN')} đ
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-400/90 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>~ {budgetOverview?.available_images_estimate ?? 0} ảnh có thể tạo</span>
                </div>
              </div>
            </div>

            {/* Visual Budget Progress Bar */}
            <div className="relative z-10 rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300">
                  Tiến độ: <strong className="text-amber-400">{(budgetOverview?.budget_used ?? 0).toLocaleString('vi-VN')} đ</strong> / {(budgetOverview?.budget_total ?? 0).toLocaleString('vi-VN')} đ ({budgetOverview?.used_percent ?? 0}% đã dùng)
                </span>
                <span className="text-emerald-400 font-bold">
                  Khả dụng: {(budgetOverview?.budget_remaining ?? 0).toLocaleString('vi-VN')} đ ({100 - (budgetOverview?.used_percent ?? 0)}%)
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 shadow-sm"
                  style={{
                    width: `${Math.min(100, Math.max(3, 100 - (budgetOverview?.used_percent ?? 0)))}%`,
                  }}
                />
              </div>
            </div>

            {/* Model Rates Live Grid */}
            <div className="relative z-10 pt-1 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Cpu size={14} className="text-amber-400" />
                  Bảng Giá Gốc Từng Model NCC (Đồng Bộ Trực Tiếp)
                </span>
                <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                  Đồng bộ chuẩn 1:1 AI Gateway
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {(
                  budgetOverview?.models_rates || [
                    {
                      model: 'gpt-image-2.5-flare',
                      display_name: 'GPT Image 2.5 Flare',
                      cost_per_req: 75,
                      unit: 'đ / request',
                    },
                    {
                      model: 'gpt-image-2.5-sunburst',
                      display_name: 'GPT Image 2.5 Sunburst',
                      cost_per_req: 75,
                      unit: 'đ / request',
                    },
                    {
                      model: 'gpt-image-2',
                      display_name: 'GPT Image 2',
                      cost_per_req: 70,
                      unit: 'đ / request',
                    },
                    {
                      model: 'gemini-3.1-flash-image-preview',
                      display_name: 'Gemini 3.1 Flash Image',
                      cost_per_req: 50,
                      unit: 'đ / request',
                    },
                  ]
                ).map((m) => (
                  <div
                    key={m.model}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 hover:bg-white/[0.05] transition-all font-mono space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-200 truncate">{m.model}</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-sans font-bold">
                        Active
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-slate-400">Đơn giá vốn:</span>
                      <span className="font-bold text-amber-400">{m.cost_per_req} đ</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block">Token: 0 • đã tính 0 đ</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Top-up Action Bar */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 border border-brand-100">
                <TrendingUp size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Nạp Nhanh Ngân Sách NCC Trực Tiếp Qua Web
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chọn gói nạp ngân sách để cập nhật hạn mức cho hệ thống ngay trên web mà không cần vào bot Telegram.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {quickTopupPresets.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => {
                    setTopupAmount(p.value);
                    setIsTopupModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-brand-50 hover:border-brand-300 hover:text-brand-700 font-bold text-xs transition-all active:scale-95"
                >
                  {p.label}
                </button>
              ))}
              <Button
                variant="primary"
                size="sm"
                leftIcon={<PlusCircle size={14} />}
                onClick={() => {
                  setTopupAmount(100000);
                  setIsTopupModalOpen(true);
                }}
              >
                Tùy chọn khác
              </Button>
            </div>
          </div>

          {/* Top-up Audit History Table with Delete Actions & Clean Empty State */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <History size={16} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Nhật Ký Lịch Sử Nạp Ngân Sách NCC (Web Audit Log)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Lịch sử các giao dịch nạp hạn mức QuotaGuard được quản lý trên Web
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-mono bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  {budgetOverview?.recent_topups?.length || 0} bản ghi
                </span>
                {budgetOverview?.recent_topups && budgetOverview.recent_topups.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Trash2 size={13} className="text-rose-500" />}
                    onClick={handleClearAllLogs}
                    className="text-rose-600 hover:bg-rose-50 hover:border-rose-300"
                  >
                    Xoá tất cả log
                  </Button>
                )}
              </div>
            </div>

            {budgetOverview?.recent_topups && budgetOverview.recent_topups.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Mã Giao Dịch</th>
                      <th className="py-3 px-4">Thời Gian</th>
                      <th className="py-3 px-4">Số Tiền Nạp</th>
                      <th className="py-3 px-4">Ngân Sách Trước & Sau</th>
                      <th className="py-3 px-4">Người Nạp</th>
                      <th className="py-3 px-4">Ghi Chú</th>
                      <th className="py-3 px-4 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {budgetOverview.recent_topups.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-slate-700">
                          <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                            {log.id}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono">{log.created_at}</td>
                        <td className="py-3 px-4 font-mono font-black text-emerald-600 text-sm">
                          + {log.amount.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {log.budget_before.toLocaleString('vi-VN')} đ →{' '}
                          <strong className="text-slate-900">
                            {log.budget_after.toLocaleString('vi-VN')} đ
                          </strong>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-semibold">{log.created_by || 'Super Admin'}</td>
                        <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{log.note || 'Nạp ngân sách Web'}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteLog(log.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title={`Xoá bản ghi ${log.id}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 px-6 text-center space-y-3">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
                  <ShieldCheck size={26} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-slate-900">
                    Ngân Sách Đang Khớp Chuẩn Với Nhà Cung Cấp
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Tất cả các bản ghi nạp thử nghiệm đã được dọn sạch. Ngân sách gốc{' '}
                    <strong className="text-slate-800 font-mono">100.000 đ</strong> đang hoạt động ổn định và sẵn sàng phục vụ tạo ảnh an toàn qua QuotaGuard.
                  </p>
                </div>
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<PlusCircle size={14} className="text-brand-600" />}
                    onClick={() => {
                      setTopupAmount(100000);
                      setIsTopupModalOpen(true);
                    }}
                  >
                    Ghi nhận nạp ngân sách mới
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL GHI NHẬN NẠP NGÂN SÁCH NCC (PORTAL MODAL) */}
      <Modal
        isOpen={isTopupModalOpen}
        onClose={() => setIsTopupModalOpen(false)}
        title="Ghi Nhận Nạp Ngân Sách NCC"
        description="Cập nhật hạn mức ngân sách QuotaGuard trực tiếp trên Web (không cần vào bot Telegram)"
        size="md"
      >
        <form onSubmit={handleTopupSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Số tiền nạp thêm (VNĐ) *
            </label>
            <input
              type="number"
              min="10000"
              step="10000"
              required
              value={topupAmount}
              onChange={(e) => setTopupAmount(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
            {/* Preset quick buttons */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              {quickTopupPresets.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setTopupAmount(p.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                    topupAmount === p.value
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Ghi chú giao dịch / Mã tham chiếu
            </label>
            <input
              type="text"
              value={topupNote}
              onChange={(e) => setTopupNote(e.target.value)}
              placeholder="Ví dụ: Chuyển khoản VietQR nạp key Xompet"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs text-slate-600 space-y-2">
            <div className="flex justify-between items-center">
              <span>Ngân sách hiện tại:</span>
              <span className="font-mono font-bold text-slate-900">
                {(budgetOverview?.budget_total ?? 100000).toLocaleString('vi-VN')} đ
              </span>
            </div>
            <div className="flex justify-between items-center text-brand-600 font-bold border-t border-slate-200/60 pt-2">
              <span>Ngân sách mới sau nạp:</span>
              <span className="font-mono text-sm">
                {((budgetOverview?.budget_total ?? 100000) + (topupAmount || 0)).toLocaleString(
                  'vi-VN'
                )}{' '}
                đ
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsTopupModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              leftIcon={<Check size={14} />}
              isLoading={isSubmittingTopup}
            >
              Xác Nhận Nạp Ngay
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
