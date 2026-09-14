import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../../../core/components/Card/Card';
import { Badge } from '../../../core/components/Badge/Badge';
import { Button } from '../../../core/components/Button/Button';
import { Table, type Column } from '../../../core/components/Table';
import {
  Wallet,
  ArrowDownToLine,
  QrCode,
  CreditCard,
  DollarSign,
  TrendingUp,
  Zap,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../core/hooks/useAuth';
import { useBilling } from '../hooks/useBilling';
import { generationsApi } from '../../generations/api';
import type { FinancialSummary, ProviderStatus } from '../../generations/types';
import { alert } from '../../../core/alert';
import type { TransactionItem } from '../types';

export const BillingPage: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = isSuperAdmin || user?.role === 'ADMIN';

  const { wallet, transactions, isLoading } = useBilling();
  const [financials, setFinancials] = useState<FinancialSummary | null>(null);
  const [providerStatus, setProviderStatus] = useState<ProviderStatus | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadFinancials = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const [finRes, provRes] = await Promise.all([
        generationsApi.getFinancialSummary(),
        generationsApi.getProviderStatus(),
      ]);
      if (finRes.success && finRes.data) setFinancials(finRes.data);
      if (provRes.success && provRes.data) setProviderStatus(provRes.data);
    } catch (e) {
      console.warn('Lỗi tải tài chính AI:', e);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadFinancials();
  }, [loadFinancials]);

  const handleSyncProvider = async () => {
    setIsSyncing(true);
    try {
      const res = await generationsApi.syncProvider();
      if (res.success && res.data) {
        setProviderStatus(res.data);
        alert.toast('Đồng bộ số dư ví nhà cung cấp thành công!', 'success');
      }
    } catch (err: any) {
      alert.error('Lỗi đồng bộ ví NCC', err?.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const formatVND = (num: number) => new Intl.NumberFormat('vi-VN').format(num) + ' đ';

  const handleQR = () => {
    alert.info(
      'Mã QR Nạp Tiền Doanh Nghiệp',
      'Vui lòng mở ứng dụng ngân hàng hoặc ví điện tử để quét mã thanh toán nạp tiền tự động qua VietQR/SePay.'
    );
  };

  const handleDeposit = async () => {
    const confirmed = await alert.confirm({
      title: 'Xác Nhận Nạp Tiền SePay',
      text: 'Hệ thống sẽ chuyển hướng bạn tới cổng thanh toán trực tuyến SePay để hoàn tất giao dịch nạp Credit.',
      confirmButtonText: 'Tiến hành nạp',
      cancelButtonText: 'Để sau',
    });

    if (confirmed) {
      alert.toast('Đang khởi tạo phiên thanh toán...', 'info');
    }
  };

  const columns: Column<TransactionItem>[] = [
    {
      key: 'id',
      title: 'Mã Giao Dịch',
      dataIndex: 'id',
      render: (val) => <span className="font-mono font-semibold text-slate-700">{val}</span>,
    },
    {
      key: 'gateway',
      title: 'Cổng Thanh Toán',
      dataIndex: 'gateway',
      render: (val) => <span className="font-semibold text-slate-800">{val}</span>,
    },
    {
      key: 'amount',
      title: 'Số Tiền',
      dataIndex: 'amount',
      sortable: true,
      render: (val) => <span className="font-bold text-emerald-600">{val}</span>,
    },
    {
      key: 'description',
      title: 'Nội Dung',
      dataIndex: 'description',
      render: (val) => <span className="text-slate-600">{val}</span>,
    },
    {
      key: 'created_at',
      title: 'Thời Gian',
      dataIndex: 'created_at',
      render: (val) => <span className="text-slate-500">{val}</span>,
    },
    {
      key: 'status',
      title: 'Trạng Thái',
      align: 'right',
      render: () => <Badge variant="success">Hoàn thành</Badge>,
    },
  ];

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {isAdmin ? 'Ví & Dòng Tiền Doanh Nghiệp' : 'Ví & Lịch Sử Giao Dịch'}
            </h1>
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold border border-emerald-200">
              {isAdmin ? 'Quản Trị Doanh Nghiệp' : 'Ví Cá Nhân'}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {isAdmin
              ? 'Quản lý số dư ví, nạp tiền tự động qua SePay và đối soát dòng tiền cổng AI Generator.'
              : 'Quản lý số dư ví cá nhân, nạp tiền tự động qua SePay / VietQR và tra cứu lịch sử nạp tiền.'}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="md" leftIcon={<QrCode size={16} />} onClick={handleQR}>
            Quét mã QR
          </Button>
          <Button variant="primary" size="md" leftIcon={<ArrowDownToLine size={16} />} onClick={handleDeposit}>
            Nạp tiền SePay
          </Button>
        </div>
      </div>

      {/* Primary Customer Wallet Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card padding="md" className="border-l-4 border-l-brand-500">
          <div className="flex items-center gap-2.5 text-slate-500 text-xs font-semibold">
            <Wallet size={18} className="text-brand-500" />
            <span>Số dư ví khả dụng</span>
          </div>
          <div className="text-2xl font-black mt-2.5 text-slate-900">
            {wallet?.balance_amount || '0 đ'}
          </div>
          <Badge variant="success" style={{ marginTop: 8 }}>Sẵn sàng gọi API</Badge>
        </Card>

        <Card padding="md" className="border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-2.5 text-slate-500 text-xs font-semibold">
            <CreditCard size={18} className="text-emerald-500" />
            <span>Tổng tiền đã nạp</span>
          </div>
          <div className="text-2xl font-black mt-2.5 text-slate-900">
            {wallet?.total_deposited || '0 đ'}
          </div>
          <Badge variant="info" style={{ marginTop: 8 }}>Tích lũy trọn đời</Badge>
        </Card>

        <Card padding="md" className="border-l-4 border-l-amber-500">
          <div className="flex items-center gap-2.5 text-slate-500 text-xs font-semibold">
            <ArrowDownToLine size={18} className="text-amber-500" />
            <span>Chi phí API 7 ngày qua</span>
          </div>
          <div className="text-2xl font-black mt-2.5 text-slate-900">
            {wallet?.api_spent || '0 đ'}
          </div>
          <Badge variant="warning" style={{ marginTop: 8 }}>Mức tiêu thụ tiết kiệm</Badge>
        </Card>
      </div>

      {/* AI Gateway PnL & Provider Cashflow Section (Chỉ hiển thị cho Quản trị viên) */}
      {isAdmin && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <TrendingUp size={18} className="text-brand-500" />
                <span>Dòng Tiền & Lời Lỗ Cổng AI (Model gpt-image-2)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Phân luồng đối soát thu từ khách hàng (150đ) vs chi phí vốn trả Nhà Cung Cấp (120đ).
              </p>
            </div>
            <Link to="/app/pnl">
              <Button variant="outline" size="sm" rightIcon={<ExternalLink size={13} />}>
                Xem báo cáo PnL đầy đủ
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card padding="md" className="bg-slate-50/60 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase">Doanh Thu Thu Khách</p>
                  <h3 className="text-xl font-black text-slate-900 mt-1">
                    {formatVND(financials?.total_api_revenue ?? 0)}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    150 đ × {financials?.successful_jobs ?? 0} jobs thành công
                  </p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-orange-100 text-brand-600 flex items-center justify-center">
                  <DollarSign size={18} />
                </div>
              </div>
            </Card>

            <Card padding="md" className="bg-slate-50/60 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase">Chi Phí Vốn NCC</p>
                  <h3 className="text-xl font-black text-amber-600 mt-1">
                    {formatVND(financials?.total_provider_cost ?? 0)}
                  </h3>
                  <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                    {financials?.saved_provider_cost && financials.saved_provider_cost > 0
                      ? `⚡ Tiết kiệm: ${formatVND(financials.saved_provider_cost)} (Cache)`
                      : '120 đ / ảnh trả NCC'}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Zap size={18} />
                </div>
              </div>
            </Card>

            <Card padding="md" className="bg-slate-50/60 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase">Lợi Nhuận Gộp</p>
                  <h3 className="text-xl font-black text-emerald-700 mt-1">
                    {formatVND(financials?.gross_profit ?? 0)}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Biên lãi: 20% (+30 đ / ảnh)
                  </p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <TrendingUp size={18} />
                </div>
              </div>
            </Card>

            <Card padding="md" className="bg-slate-50/60 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase">Số Dư Ví NCC</p>
                    <button
                      onClick={handleSyncProvider}
                      disabled={isSyncing}
                      className="text-purple-600 hover:text-purple-800 p-0.5"
                      title="Đồng bộ số dư cụm máy chủ AI Engine"
                    >
                      <RefreshCw size={11} className={isSyncing ? 'animate-spin' : ''} />
                    </button>
                  </div>
                  <h3 className="text-xl font-black text-purple-700 mt-1">
                    {formatVND(providerStatus?.wallet_balance ?? 24462)}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                    AI Cluster Engine (Active)
                  </p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Wallet size={18} />
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Transactions Table Section */}
      <div className="flex flex-col gap-3">
        <h2 className="text-base font-bold text-slate-900">Lịch sử giao dịch nạp tiền (SePay / VietQR)</h2>
        <Table<TransactionItem>
          columns={columns}
          data={transactions}
          loading={isLoading}
          emptyText="Chưa có giao dịch nạp tiền nào"
          pagination={{ pageSize: 5 }}
        />
      </div>
    </div>
  );
};

