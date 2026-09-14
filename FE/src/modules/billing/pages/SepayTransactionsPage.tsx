import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Search, ExternalLink, Trash2 } from 'lucide-react';
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

  const columns: Column<SepayTransactionItem>[] = [
    {
      key: 'transaction_date',
      title: 'Thời Gian',
      dataIndex: 'transaction_date',
      render: (val) => <span className="font-mono text-xs text-slate-600 whitespace-nowrap">{val}</span>,
    },
    {
      key: 'gateway',
      title: 'Cổng Ngân Hàng',
      dataIndex: 'gateway',
      render: (val) => (
        <span className="font-semibold text-slate-800 text-xs whitespace-nowrap flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          {val}
        </span>
      ),
    },
    {
      key: 'code',
      title: 'Mã Cú Pháp (Code)',
      dataIndex: 'code',
      render: (val) => (
        <span className="font-mono font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200 text-xs">
          {val || '-'}
        </span>
      ),
    },
    {
      key: 'amount_in',
      title: 'Số Tiền Nạp',
      dataIndex: 'amount_in',
      render: (val) => (
        <span className="font-black text-emerald-600 text-xs whitespace-nowrap">
          + {formatVND(Number(val))}
        </span>
      ),
    },
    {
      key: 'accumulated',
      title: 'Số Dư Sau Giao Dịch',
      dataIndex: 'accumulated',
      render: (val) => (
        <span className="font-mono text-slate-700 text-xs whitespace-nowrap">
          {formatVND(Number(val))}
        </span>
      ),
    },
    {
      key: 'transaction_content',
      title: 'Nội Dung Chuyển Khoản',
      dataIndex: 'transaction_content',
      render: (val) => (
        <span className="text-slate-600 text-xs max-w-xs truncate block" title={String(val)}>
          {val}
        </span>
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
            Đối soát danh sách dòng tiền nạp vào hệ thống tự động thông qua cổng thanh toán SePay và mã QR chuyển khoản.
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
      <Table<SepayTransactionItem>
        columns={columns}
        data={filtered}
        loading={isLoading}
        rowKey="id"
        emptyText="Chưa có giao dịch SePay nào được ghi nhận."
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};
