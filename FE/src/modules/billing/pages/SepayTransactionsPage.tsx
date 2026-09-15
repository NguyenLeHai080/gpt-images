import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  Search,
  ExternalLink,
  Trash2,
  Wallet,
  ArrowDownToLine,
  TrendingUp,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Table, type Column } from '../../../core/components/Table';
import { Button } from '../../../core/components/Button/Button';
import { Badge } from '../../../core/components/Badge/Badge';
import { alert } from '../../../core/alert';
import { billingApi } from '../api';
import type { SepayTransactionItem } from '../types';

export const SepayTransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<SepayTransactionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await billingApi.getSepayTransactions();
      if (res.success && res.data) {
        setTransactions(res.data);
      }
    } catch (err) {
      console.warn('Lỗi tải giao dịch SePay:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleClearHistory = async () => {
    const confirmed = await alert.confirm({
      title: 'Xoá lịch sử nạp SePay?',
      text: 'Toàn bộ nhật ký đối soát nạp tiền SePay sẽ được dọn sạch khỏi hệ thống. Bạn có chắc chắn muốn thực hiện?',
      confirmButtonText: 'Đồng ý xoá',
      cancelButtonText: 'Huỷ bỏ',
      isDanger: true,
    });

    if (confirmed) {
      setIsLoading(true);
      try {
        await billingApi.clearSepayTransactions();
        await loadData();
      } catch (err: any) {
        alert.error('Lỗi khi xoá lịch sử', err?.message || 'Không thể xoá lịch sử nạp tiền');
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = transactions.filter((t) => {
    const s = search.toLowerCase().trim();
    return (
      !s ||
      t.id.toLowerCase().includes(s) ||
      t.transaction_content.toLowerCase().includes(s) ||
      (t.code && t.code.toLowerCase().includes(s)) ||
      t.reference_number.toLowerCase().includes(s)
    );
  });

  const formatVND = (num: number) => new Intl.NumberFormat('vi-VN').format(num) + ' đ';

  // Tính toán các chỉ số tài chính dòng tiền từ giao dịch nạp SePay
  const totalCustomerDeposit = transactions.reduce((acc, t) => acc + (Number(t.amount_in) || 0), 0);
  const totalProviderCostToTopup = Math.round(totalCustomerDeposit * (75 / 150));
  const totalGrossProfit = totalCustomerDeposit - totalProviderCostToTopup;
  const totalImagesCapacity = Math.floor(totalCustomerDeposit / 150);

  const columns: Column<SepayTransactionItem>[] = [
    {
      key: 'transaction_date',
      title: 'Thời Gian',
      dataIndex: 'transaction_date',
      render: (val) => <span className="font-mono text-xs text-slate-600 whitespace-nowrap">{val}</span>,
    },
    {
      key: 'code',
      title: 'Mã User / Cú Pháp',
      dataIndex: 'code',
      render: (val) => (
        <span className="font-mono font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200 text-xs whitespace-nowrap">
          {val || '-'}
        </span>
      ),
    },
    {
      key: 'amount_in',
      title: 'Tiền Khách Nạp (150đ/ảnh)',
      dataIndex: 'amount_in',
      align: 'right',
      render: (val) => {
        const amt = Number(val || 0);
        const images = Math.floor(amt / 150);
        return (
          <div className="whitespace-nowrap text-right">
            <span className="font-black text-emerald-600 text-xs block font-mono">
              + {formatVND(amt)}
            </span>
            <span className="text-[10px] text-slate-400 font-medium block">
              ~{images.toLocaleString()} ảnh
            </span>
          </div>
        );
      },
    },
    {
      key: 'provider_cost',
      title: 'Cần Nạp Cho NCC (Vốn 50%)',
      align: 'right',
      render: (_, record) => {
        const amt = Number(record.amount_in || 0);
        const ncc = record.provider_cost != null ? record.provider_cost : Math.round(amt * (75 / 150));
        return (
          <div className="whitespace-nowrap text-right">
            <span className="font-bold text-blue-700 text-xs block font-mono">
              {formatVND(ncc)}
            </span>
            <span className="inline-block text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200/80">
              Vốn 75đ/ảnh (50%)
            </span>
          </div>
        );
      },
    },
    {
      key: 'gross_profit',
      title: 'Tiền Lời Giữ Lại (Lời 50%)',
      align: 'right',
      render: (_, record) => {
        const amt = Number(record.amount_in || 0);
        const profit = record.gross_profit != null ? record.gross_profit : Math.round(amt * (75 / 150));
        return (
          <div className="whitespace-nowrap text-right">
            <span className="font-black text-emerald-700 text-xs block font-mono">
              +{formatVND(profit)}
            </span>
            <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/80">
              Lời 75đ/ảnh (50%)
            </span>
          </div>
        );
      },
    },
    {
      key: 'transaction_content',
      title: 'Nội Dung Chuyển Khoản',
      dataIndex: 'transaction_content',
      render: (val) => (
        <span className="text-slate-700 text-xs max-w-xs truncate block font-medium" title={String(val)}>
          {val}
        </span>
      ),
    },
    {
      key: 'gateway',
      title: 'Ngân Hàng & STK',
      dataIndex: 'gateway',
      render: (val, record) => (
        <div className="whitespace-nowrap text-xs">
          <span className="font-semibold text-slate-800 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {val}
          </span>
          <span className="text-[10px] text-slate-400 font-mono block">
            STK: {record.account_number}
          </span>
        </div>
      ),
    },
    {
      key: 'reference_number',
      title: 'Mã Tham Chiếu',
      dataIndex: 'reference_number',
      render: (val) => <span className="font-mono text-slate-400 text-xs">{val}</span>,
    },
    {
      key: 'status',
      title: 'Trạng Thái',
      dataIndex: 'status',
      render: () => <Badge variant="success">Hoàn tất</Badge>,
    },
  ];

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Lịch Sử Nạp Tiền SePay</h1>
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold border border-emerald-200">
              Auto VietQR Webhook
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Hệ thống đối soát tự động, bóc tách giá vốn cần nạp thủ công cho Nhà Cung Cấp (75đ/ảnh) và Lợi nhuận gộp giữ lại (75đ/ảnh, biên lãi 50%).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            leftIcon={<RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />}
            onClick={loadData}
          >
            Làm mới
          </Button>
          <Button
            variant="outline"
            size="md"
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
            leftIcon={<Trash2 size={15} />}
            onClick={handleClearHistory}
            disabled={isLoading || transactions.length === 0}
          >
            Xoá lịch sử
          </Button>
          <Button
            variant="primary"
            size="md"
            leftIcon={<ExternalLink size={15} />}
            onClick={() => alert.info('Cổng SePay Gateway', 'Hệ thống tích hợp trực tiếp webhook đồng bộ 24/7 theo chuẩn API SePay.')}
          >
            Cổng Webhook SePay
          </Button>
        </div>
      </div>

      {/* Financial KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng tiền khách nạp */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng Tiền Khách Nạp</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{formatVND(totalCustomerDeposit)}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Bán ra: 150 đ / ảnh</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-2xs">
              <Wallet size={20} />
            </div>
          </div>
        </div>

        {/* Card 2: Cần nạp cho Nhà Cung Cấp */}
        <div className="p-4 rounded-2xl bg-white border border-blue-200/90 shadow-2xs ring-2 ring-blue-500/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                <span>Cần Nạp Cho NCC</span>
                <span className="bg-blue-100 text-blue-700 text-[9px] px-1.5 py-0.2 rounded font-black">VỐN 50%</span>
              </p>
              <h3 className="text-2xl font-black text-blue-700 mt-1">{formatVND(totalProviderCostToTopup)}</h3>
              <p className="text-[11px] text-blue-600/80 mt-0.5 font-medium">75 đ / ảnh (Admin nạp NCC)</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-2xs">
              <ArrowDownToLine size={20} />
            </div>
          </div>
        </div>

        {/* Card 3: Lợi nhuận giữ lại */}
        <div className="p-4 rounded-2xl bg-white border border-emerald-200/90 shadow-2xs ring-2 ring-emerald-500/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                <span>Lợi Nhuận Giữ Lại</span>
                <span className="bg-emerald-100 text-emerald-700 text-[9px] px-1.5 py-0.2 rounded font-black">LỜI 50%</span>
              </p>
              <h3 className="text-2xl font-black text-emerald-700 mt-1">+{formatVND(totalGrossProfit)}</h3>
              <p className="text-[11px] text-emerald-600/80 mt-0.5 font-medium">Lời 75 đ / ảnh (Lợi nhuận gộp 50%)</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-2xs">
              <TrendingUp size={20} />
            </div>
          </div>
        </div>

        {/* Card 4: Số lượng ảnh quy đổi */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lượng Ảnh Quy Đổi</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">~{totalImagesCapacity.toLocaleString()} ảnh</h3>
              <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Đồng giá 150 đ / ảnh</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-2xs">
              <Sparkles size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm theo mã cú pháp, nội dung chuyển khoản, mã giao dịch..."
            className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 shadow-xs transition-all"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span className="font-semibold flex items-center gap-1.5 text-slate-700">
            <Layers size={14} className="text-brand-500" />
            <span>Bảng Phân Tách Dòng Tiền Thu Khách vs Vốn NCC</span>
          </span>
          <span>Công thức: Giá bán 150đ = 75đ Vốn NCC (50%) + 75đ Lợi nhuận (50%)</span>
        </div>

        <Table<SepayTransactionItem>
          columns={columns}
          data={filtered}
          loading={isLoading}
          rowKey="id"
          emptyText="Chưa có giao dịch SePay nào được ghi nhận."
          pagination={{ pageSize: 10 }}
        />
      </div>
    </div>
  );
};
