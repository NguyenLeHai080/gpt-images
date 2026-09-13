import React from 'react';
import { Card } from '../../../core/components/Card/Card';
import { Badge } from '../../../core/components/Badge/Badge';
import { Button } from '../../../core/components/Button/Button';
import { KeyRound, Plus, Copy, Check } from 'lucide-react';
import { useApiKeys } from '../hooks/useApiKeys';

export const ApiKeysPage: React.FC = () => {
  const { keys, isLoading } = useApiKeys();
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopy = (id: string, prefix: string) => {
    navigator.clipboard.writeText(prefix);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-text-main)' }}>
            API Keys & Gói dịch vụ
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 4 }}>
            Quản lý và cấp quyền truy cập bảo mật cho các ứng dụng vệ tinh và đối tác.
          </p>
        </div>
        <Button variant="primary" size="md" leftIcon={<Plus size={16} />}>
          Tạo API Key mới
        </Button>
      </div>

      <Card padding="none">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>TÊN KEY</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>PREFIX KEY</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>TRẠNG THÁI</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>GIỚI HẠN (RATE LIMIT)</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>LẦN CUỐI SỬ DỤNG</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>
                    Đang tải danh sách API Key...
                  </td>
                </tr>
              ) : (
                keys.slice(0, 8).map((k) => (
                  <tr key={k.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--color-text-main)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <KeyRound size={15} color="var(--color-primary)" />
                        <span>{k.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', fontFamily: 'monospace', color: '#475569' }}>
                      {k.key_prefix}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <Badge variant="success">Đang hoạt động</Badge>
                    </td>
                    <td style={{ padding: '14px 20px', color: '#64748B' }}>
                      {k.rate_limit}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#64748B' }}>
                      {k.last_used}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={copiedId === k.id ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
                        onClick={() => handleCopy(k.id, k.key_prefix)}
                      >
                        {copiedId === k.id ? 'Đã chép' : 'Sao chép'}
                      </Button>
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
