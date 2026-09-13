import React from 'react';
import { Card } from '../../../core/components/Card/Card';
import { Badge } from '../../../core/components/Badge/Badge';
import { Button } from '../../../core/components/Button/Button';
import { Wallet, ArrowDownToLine, QrCode, CreditCard } from 'lucide-react';
import { useBilling } from '../hooks/useBilling';

import { alert } from '../../../core/alert';

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

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-text-main)' }}>
            Ví & Dòng tiền doanh nghiệp
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 4 }}>
            Quản lý số dư API, nạp tiền tự động qua SePay và đối soát ngân hàng QR.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="outline" size="md" leftIcon={<QrCode size={16} />} onClick={handleQR}>
            Quét mã QR
          </Button>
          <Button variant="primary" size="md" leftIcon={<ArrowDownToLine size={16} />} onClick={handleDeposit}>
            Nạp tiền SePay
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <Card padding="md">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#64748B', fontSize: 13, fontWeight: 600 }}>
            <Wallet size={18} color="var(--color-primary)" />
            <span>Số dư ví khả dụng</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 10, color: 'var(--color-text-main)' }}>
            {wallet?.balance_amount || '24.702 đ'}
          </div>
          <Badge variant="success" style={{ marginTop: 8 }}>
            Sẵn sàng gọi API
          </Badge>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#64748B', fontSize: 13, fontWeight: 600 }}>
            <CreditCard size={18} color="#10B981" />
            <span>Tổng tiền đã nạp</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 10, color: 'var(--color-text-main)' }}>
            {wallet?.total_deposited || '4.331.500 đ'}
          </div>
          <Badge variant="info" style={{ marginTop: 8 }}>
            Tích lũy trọn đời
          </Badge>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#64748B', fontSize: 13, fontWeight: 600 }}>
            <ArrowDownToLine size={18} color="#F59E0B" />
            <span>Chi phí API 7 ngày qua</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 10, color: 'var(--color-text-main)' }}>
            {wallet?.api_spent || '480 đ'}
          </div>
          <Badge variant="warning" style={{ marginTop: 8 }}>
            Mức tiêu thụ tiết kiệm
          </Badge>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card padding="none">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', fontWeight: 700, fontSize: 15 }}>
          Lịch sử giao dịch nạp tiền
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>MÃ GIAO DỊCH</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>CỔNG THANH TOÁN</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>SỐ TIỀN</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>NỘI DUNG</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>THỜI GIAN</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>TRẠNG THÁI</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ padding: 30, textAlign: 'center', color: '#94A3B8' }}>
                    Đang tải giao dịch...
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '14px 20px', fontFamily: 'monospace', fontWeight: 600 }}>
                      {tx.id}
                    </td>
                    <td style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--color-text-main)' }}>
                      {tx.gateway}
                    </td>
                    <td style={{ padding: '14px 20px', fontWeight: 700, color: '#10B981' }}>
                      {tx.amount}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#64748B' }}>
                      {tx.description}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#64748B' }}>
                      {tx.created_at}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <Badge variant="success">Hoàn thành</Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
