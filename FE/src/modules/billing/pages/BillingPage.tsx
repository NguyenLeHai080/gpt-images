import React from 'react';
import { Card } from '../../../core/components/Card/Card';
import { Badge } from '../../../core/components/Badge/Badge';
import { Button } from '../../../core/components/Button/Button';
import { Table, type Column } from '../../../core/components/Table';
import { Wallet, ArrowDownToLine, QrCode, CreditCard } from 'lucide-react';
import { useBilling } from '../hooks/useBilling';
import { alert } from '../../../core/alert';
import type { TransactionItem } from '../types';

export const BillingPage: React.FC = () => {
  const { wallet, transactions, isLoading } = useBilling();

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
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Ví & Dòng Tiền Doanh Nghiệp</h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý số dư API, nạp tiền tự động qua SePay và đối soát ngân hàng QR.</p>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card padding="md">
          <div className="flex items-center gap-2.5 text-slate-500 text-xs font-semibold">
            <Wallet size={18} className="text-brand-500" />
            <span>Số dư ví khả dụng</span>
          </div>
          <div className="text-2xl font-black mt-2.5 text-slate-900">
            {wallet?.balance_amount || '24.702 đ'}
          </div>
          <Badge variant="success" style={{ marginTop: 8 }}>Sẵn sàng gọi API</Badge>
        </Card>

        <Card padding="md">
          <div className="flex items-center gap-2.5 text-slate-500 text-xs font-semibold">
            <CreditCard size={18} className="text-emerald-500" />
            <span>Tổng tiền đã nạp</span>
          </div>
          <div className="text-2xl font-black mt-2.5 text-slate-900">
            {wallet?.total_deposited || '4.331.500 đ'}
          </div>
          <Badge variant="info" style={{ marginTop: 8 }}>Tích lũy trọn đời</Badge>
        </Card>

        <Card padding="md">
          <div className="flex items-center gap-2.5 text-slate-500 text-xs font-semibold">
            <ArrowDownToLine size={18} className="text-amber-500" />
            <span>Chi phí API 7 ngày qua</span>
          </div>
          <div className="text-2xl font-black mt-2.5 text-slate-900">
            {wallet?.api_spent || '480 đ'}
          </div>
          <Badge variant="warning" style={{ marginTop: 8 }}>Mức tiêu thụ tiết kiệm</Badge>
        </Card>
      </div>

      {/* Transactions Table Section */}
      <div className="flex flex-col gap-3">
        <h2 className="text-base font-bold text-slate-900">Lịch sử giao dịch nạp tiền</h2>
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
