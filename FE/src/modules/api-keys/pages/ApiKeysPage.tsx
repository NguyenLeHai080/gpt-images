import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  KeyRound,
  Plus,
  Copy,
  Check,
  Search,
  BookOpen,
  Trash2,
  ShieldCheck,
  Zap,
  ExternalLink,
  Lock,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { Table, type Column } from '../../../core/components/Table';
import { Button } from '../../../core/components/Button/Button';
import { Badge } from '../../../core/components/Badge/Badge';
import { Card } from '../../../core/components/Card/Card';
import { Modal } from '../../../core/components/Modal/Modal';
import { alert } from '../../../core/alert';
import { apiKeysApi } from '../api';
import type { ApiKeyItem } from '../types';

export const ApiKeysPage: React.FC = () => {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Modal tạo key
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyRateLimit, setNewKeyRateLimit] = useState('60 req/min');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal hiển thị raw key vừa tạo
  const [createdKey, setCreatedKey] = useState<ApiKeyItem | null>(null);
  const [copiedRawKey, setCopiedRawKey] = useState(false);

  const loadKeys = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiKeysApi.getKeys();
      if (res.data) setKeys(res.data);
    } catch (err) {
      console.warn(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    alert.toast(`Đã sao chép: ${text}`, 'success', { timer: 2000 });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteKey = async (keyItem: ApiKeyItem) => {
    const isConfirmed = await alert.confirm({
      title: 'Xóa / Thu Hồi API Key',
      text: `Xác nhận xóa khóa "${keyItem.name}" (${keyItem.key_prefix})? Các ứng dụng đang sử dụng khóa này sẽ mất quyền truy cập API ngay lập tức.`,
      confirmButtonText: 'Xác nhận xóa',
      cancelButtonText: 'Hủy bỏ',
      isDanger: true,
    });

    if (isConfirmed) {
      setDeletingId(keyItem.id);
      try {
        const res = await apiKeysApi.deleteKey(keyItem.id);
        if (res.success) {
          loadKeys();
        }
      } catch (err: any) {
        alert.error('Lỗi khi xóa API Key', err?.message);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleCreateKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) {
      alert.toast('Vui lòng nhập tên nhận diện cho API Key', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiKeysApi.createKey(newKeyName.trim(), newKeyRateLimit);
      if (res.success && res.data) {
        setCreatedKey(res.data);
        setIsCreateModalOpen(false);
        setNewKeyName('');
        loadKeys();
      }
    } catch (err: any) {
      alert.error('Lỗi khởi tạo API Key', err?.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredKeys = useMemo(() => {
    return keys.filter((k) => {
      return (
        k.name.toLowerCase().includes(search.toLowerCase()) ||
        k.key_prefix.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [keys, search]);

  const activeKeysCount = useMemo(() => {
    return keys.filter((k) => k.status === 'active' || !k.status).length;
  }, [keys]);

  const columns: Column<ApiKeyItem>[] = [
    {
      key: 'name',
      title: 'Tên API Key',
      dataIndex: 'name',
      sortable: true,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-50 text-brand-600 flex items-center justify-center border border-brand-200/80 shrink-0">
            <KeyRound size={15} />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-xs block">{record.name}</span>
            <span className="text-[10px] text-slate-400">ID: {record.id}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'key_prefix',
      title: 'Mã Token (Prefix)',
      dataIndex: 'key_prefix',
      render: (val, record) => (
        <div className="flex items-center gap-2">
          <span className="font-mono bg-slate-100 border border-slate-200/80 px-2 py-1 rounded text-xs text-slate-700 font-semibold">
            {val}
          </span>
          <button
            type="button"
            onClick={() => handleCopy(record.id, record.key_prefix)}
            className="text-slate-400 hover:text-brand-600 p-1 transition-colors"
            title="Sao chép prefix"
          >
            {copiedId === record.id ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
          </button>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Trạng Thái',
      dataIndex: 'status',
      render: () => (
        <Badge variant="success">Đang hoạt động</Badge>
      ),
    },
    {
      key: 'rate_limit',
      title: 'Giới Hạn Tốc Độ',
      dataIndex: 'rate_limit',
      sortable: true,
      render: (val) => (
        <span className="text-slate-600 font-medium text-xs bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
          {val || '60 req/min'}
        </span>
      ),
    },
    {
      key: 'last_used',
      title: 'Lần Cuối Dùng',
      dataIndex: 'last_used',
      render: (val) => <span className="text-slate-500 text-xs">{val || 'Chưa sử dụng'}</span>,
    },
    {
      key: 'created_at',
      title: 'Ngày Khởi Tạo',
      dataIndex: 'created_at',
      render: (val) => <span className="text-slate-500 text-xs">{val}</span>,
    },
    {
      key: 'actions',
      title: 'Thao Tác',
      align: 'right',
      render: (_, record) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="outline"
            size="sm"
            leftIcon={copiedId === record.id ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
            onClick={() => handleCopy(record.id, record.key_prefix)}
            title="Sao chép prefix"
          >
            {copiedId === record.id ? 'Đã chép' : 'Sao chép'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteKey(record)}
            disabled={deletingId === record.id}
            title="Xóa / Thu hồi API Key này"
            className="text-slate-400 hover:text-rose-600 px-2"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Quản Lý API Keys & Cổng Khách Hàng
            </h1>
            <span className="text-xs bg-brand-50 text-brand-600 px-2.5 py-0.5 rounded-full font-bold border border-brand-200">
              REST Cổng Khách
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý mã truy cập Bearer Token cho các ứng dụng, website và hệ thống khách hàng kết nối tới Model gpt-image-2.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            leftIcon={<RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />}
            onClick={loadKeys}
          >
            Làm mới
          </Button>
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus size={15} />}
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-brand-500 hover:bg-brand-600 text-white font-bold shadow-md shadow-brand-500/20"
          >
            + Tạo API Key Mới
          </Button>
        </div>
      </div>

      {/* Developer Docs Quick Callout Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-brand-950 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center shrink-0">
            <BookOpen size={20} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <span>Tài Liệu Tích Hợp API Đã Sẵn Sàng (API Docs)</span>
              <span className="text-[10px] bg-brand-500 text-white px-2 py-0.2 rounded-full font-bold">Mới</span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Xem đầy đủ mẫu code <strong>cURL, Python, Node.js, PHP</strong>, bảng tham số và cơ chế Smart Cache 25ms.
            </p>
          </div>
        </div>

        <Link to="/app/api-docs" className="shrink-0 w-full sm:w-auto">
          <Button
            variant="primary"
            size="sm"
            className="bg-brand-500 hover:bg-brand-600 text-white font-bold w-full"
            rightIcon={<ExternalLink size={13} />}
          >
            Xem Tài Liệu API Docs
          </Button>
        </Link>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md" className="border-l-4 border-l-brand-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng Số API Keys</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{keys.length}</h3>
              <p className="text-[11px] text-slate-400 mt-1">Đã cấp phát cho ứng dụng</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-orange-50 text-brand-600 flex items-center justify-center shrink-0">
              <KeyRound size={20} />
            </div>
          </div>
        </Card>

        <Card padding="md" className="border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Khóa Đang Hoạt Động</p>
              <h3 className="text-2xl font-black text-emerald-700 mt-1">{activeKeysCount}</h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">Sẵn sàng nhận request</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} />
            </div>
          </div>
        </Card>

        <Card padding="md" className="border-l-4 border-l-sky-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Định Mức Rate Limit</p>
              <h3 className="text-2xl font-black text-sky-700 mt-1">60 req/min</h3>
              <p className="text-[11px] text-slate-400 mt-1">Chống DDOS & quá tải</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <Zap size={20} />
            </div>
          </div>
        </Card>

        <Card padding="md" className="border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Model Khả Dụng</p>
              <h3 className="text-2xl font-black text-purple-700 mt-1">gpt-image-2</h3>
              <p className="text-[11px] text-purple-600 font-semibold mt-1">1K • 2K • 4K Ultra HD</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Lock size={20} />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm API Key theo tên, prefix..."
            className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 shadow-2xs transition-all"
          />
        </div>
      </div>

      {/* Table API Keys */}
      <Table<ApiKeyItem>
        columns={columns}
        data={filteredKeys}
        loading={isLoading}
        emptyText="Chưa có API Key nào được tạo. Hãy bấm '+ Tạo API Key Mới' để bắt đầu kết nối!"
        pagination={{ pageSize: 8 }}
      />

      {/* Modal Tạo API Key Mới */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        size="md"
        title={
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-brand-600 flex items-center justify-center border border-brand-200 shrink-0">
              <KeyRound size={16} />
            </div>
            <div>
              <span className="text-base font-extrabold text-slate-900">Khởi Tạo API Key Mới</span>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                Cấp quyền kết nối tới Cổng Model AI gpt-image-2
              </p>
            </div>
          </div>
        }
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
              type="button"
              disabled={isSubmitting}
            >
              Hủy bỏ
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              form="create-key-form"
              disabled={isSubmitting}
              className="bg-brand-500 hover:bg-brand-600 text-white font-bold px-4"
            >
              {isSubmitting ? 'Đang tạo...' : 'Xác nhận tạo Key'}
            </Button>
          </div>
        }
      >
        <form id="create-key-form" onSubmit={handleCreateKeySubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-800 mb-1.5">
              Tên nhận diện API Key <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Ví dụ: Cổng kết nối Mobile App, Website Bán Hàng..."
              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 shadow-2xs text-xs font-medium transition-all"
              required
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Đặt tên dễ nhớ để phân biệt các ứng dụng hoặc đối tác khác nhau.
            </span>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1.5">Giới hạn gọi (Rate Limit):</label>
            <select
              value={newKeyRateLimit}
              onChange={(e) => setNewKeyRateLimit(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 shadow-2xs text-xs transition-all"
            >
              <option value="60 req/min">60 yêu cầu / phút (Mặc định)</option>
              <option value="120 req/min">120 yêu cầu / phút (Tải cao)</option>
              <option value="300 req/min">300 yêu cầu / phút (Doanh nghiệp)</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Modal Hiển Thị Raw Key Bí Mật Vừa Tạo (Chỉ hiển thị 1 lần) */}
      <Modal
        isOpen={!!createdKey}
        onClose={() => {
          setCreatedKey(null);
          setCopiedRawKey(false);
        }}
        size="md"
        title={
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shrink-0">
              <ShieldCheck size={16} />
            </div>
            <div>
              <span className="text-base font-extrabold text-slate-900">API Key Đã Khởi Tạo Thành Công</span>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                Hãy lưu lại khóa này ngay bây giờ
              </p>
            </div>
          </div>
        }
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] text-slate-400 font-medium">Bảo mật tuyệt đối</span>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setCreatedKey(null);
                setCopiedRawKey(false);
              }}
            >
              Tôi đã lưu an toàn
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-800">
            <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600" />
            <p className="text-[11px] leading-relaxed">
              <strong>Quan trọng:</strong> Vì lý do bảo mật, chuỗi khóa bí mật (Secret Key) này{' '}
              <strong>chỉ hiển thị một lần duy nhất</strong>. Bạn sẽ không thể xem lại khóa đầy đủ sau khi đóng cửa sổ này.
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Mã Khóa Bí Mật (Secret Key):</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={createdKey?.raw_key || ''}
                className="w-full bg-slate-900 text-emerald-400 font-mono text-xs p-3 rounded-xl border border-slate-800 outline-none select-all"
              />
              <Button
                variant="primary"
                size="md"
                leftIcon={copiedRawKey ? <Check size={14} /> : <Copy size={14} />}
                onClick={() => {
                  if (createdKey?.raw_key) {
                    navigator.clipboard.writeText(createdKey.raw_key);
                    setCopiedRawKey(true);
                    alert.toast('Đã sao chép Secret Key thành công!', 'success');
                  }
                }}
                className="shrink-0"
              >
                {copiedRawKey ? 'Đã chép' : 'Sao chép'}
              </Button>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-[11px] space-y-1">
            <div><strong>Tên:</strong> {createdKey?.name}</div>
            <div><strong>Prefix:</strong> <code>{createdKey?.key_prefix}</code></div>
            <div><strong>Giới hạn:</strong> {createdKey?.rate_limit}</div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
