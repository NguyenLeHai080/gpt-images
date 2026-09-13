import React, { useState, useMemo } from 'react';
import { KeyRound, Plus, Copy, Check, Search } from 'lucide-react';
import { Table, type Column } from '../../../core/components/Table';
import { Button } from '../../../core/components/Button/Button';
import { Badge } from '../../../core/components/Badge/Badge';
import { Select } from '../../../core/components/Select';
import { alert } from '../../../core/alert';
import { useApiKeys } from '../hooks/useApiKeys';
import type { ApiKeyItem } from '../types';

export const ApiKeysPage: React.FC = () => {
  const { keys, isLoading } = useApiKeys();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const handleCopy = (id: string, prefix: string) => {
    navigator.clipboard.writeText(prefix);
    setCopiedId(id);
    alert.toast(`Đã sao chép mã Key: ${prefix}`, 'success', { timer: 2000 });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateKey = async () => {
    const confirmed = await alert.confirm({
      title: 'Tạo API Key Mới?',
      text: 'Một API Key bảo mật mới sẽ được khởi tạo với hạn mức mặc định 60 RPM.',
      confirmButtonText: 'Xác nhận tạo',
      cancelButtonText: 'Hủy bỏ',
    });

    if (confirmed) {
      alert.toast('Khởi tạo API Key mới thành công!', 'success');
    }
  };

  const filteredKeys = useMemo(() => {
    return keys.filter((k) => {
      const matchSearch = k.name.toLowerCase().includes(search.toLowerCase()) || k.key_prefix.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || k.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [keys, search, statusFilter]);

  const columns: Column<ApiKeyItem>[] = [
    {
      key: 'name',
      title: 'Tên Key',
      dataIndex: 'name',
      sortable: true,
      render: (_, record) => (
        <div className="flex items-center gap-2.5 font-semibold text-slate-800">
          <KeyRound size={15} className="text-brand-500 shrink-0" />
          <span>{record.name}</span>
        </div>
      ),
    },
    {
      key: 'key_prefix',
      title: 'Prefix Key',
      dataIndex: 'key_prefix',
      render: (val) => <span className="font-mono text-slate-600 font-medium">{val}</span>,
    },
    {
      key: 'status',
      title: 'Trạng Thái',
      dataIndex: 'status',
      render: () => <Badge variant="success">Đang hoạt động</Badge>,
    },
    {
      key: 'rate_limit',
      title: 'Giới Hạn (Rate Limit)',
      dataIndex: 'rate_limit',
      sortable: true,
      render: (val) => <span className="text-slate-500 font-medium">{val}</span>,
    },
    {
      key: 'last_used',
      title: 'Lần Cuối Sử Dụng',
      dataIndex: 'last_used',
      render: (val) => <span className="text-slate-500">{val}</span>,
    },
    {
      key: 'actions',
      title: 'Hành Động',
      align: 'right',
      render: (_, record) => (
        <Button
          variant="outline"
          size="sm"
          leftIcon={copiedId === record.id ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
          onClick={() => handleCopy(record.id, record.key_prefix)}
        >
          {copiedId === record.id ? 'Đã chép' : 'Sao chép'}
        </Button>
      ),
    },
  ];

  return (
    <div className="animate-fade-in flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">API Keys & Gói Dịch Vụ</h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý và cấp quyền truy cập bảo mật cho các ứng dụng vệ tinh và đối tác.</p>
        </div>
        <Button variant="primary" size="md" leftIcon={<Plus size={16} />} onClick={handleCreateKey}>
          Tạo API Key mới
        </Button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm theo tên key hoặc mã prefix..."
            className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 shadow-sm"
          />
        </div>
        <div className="w-full sm:w-56">
          <Select
            value={statusFilter}
            onChange={(v) => setStatusFilter(String(v))}
            size="sm"
            options={[
              { label: 'Tất cả trạng thái', value: 'all' },
              { label: 'Đang hoạt động', value: 'active' },
              { label: 'Tạm dừng', value: 'paused' },
            ]}
          />
        </div>
      </div>

      {/* Reusable Core Table */}
      <Table<ApiKeyItem>
        columns={columns}
        data={filteredKeys}
        loading={isLoading}
        emptyText="Không tìm thấy API Key nào phù hợp"
        pagination={{ pageSize: 8, pageSizeOptions: [8, 16, 28] }}
      />
    </div>
  );
};
