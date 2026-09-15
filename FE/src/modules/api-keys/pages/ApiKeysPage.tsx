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
  Server,
  Eye,
  EyeOff,
  Users,
  Shield,
  ArrowRight,
  Wrench,
  Terminal,
  Code2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { systemApi, type MaintenanceStatus } from '../../../core/api/system';

import { Table, type Column } from '../../../core/components/Table';
import { Button } from '../../../core/components/Button/Button';
import { Badge } from '../../../core/components/Badge/Badge';
import { Card } from '../../../core/components/Card/Card';
import { Modal } from '../../../core/components/Modal/Modal';
import { alert } from '../../../core/alert';
import { useAuth } from '../../../core/hooks/useAuth';
import { apiClient } from '../../../core/api/client';
import { apiKeysApi } from '../api';
import { providersApi } from '../../providers/api';
import type { ApiKeyItem } from '../types';
import type { UserAccountItem, AccountsData } from '../../accounts/types';
import type { AIProvider } from '../../providers/types';

export const ApiKeysPage: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = isSuperAdmin || user?.role === 'ADMIN';

  // Navigation tabs for Admin: 'customer_keys' vs 'provider_keys'
  const [activeTab, setActiveTab] = useState<'customer_keys' | 'provider_keys'>('customer_keys');

  // Customer keys state
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Admin filter by account state
  const [accounts, setAccounts] = useState<UserAccountItem[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('all');

  // Provider state (Chỉ load cho Admin)
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  const [revealedProviderKeyIds, setRevealedProviderKeyIds] = useState<Record<string, boolean>>({});

  // Modal tạo key mới
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyRateLimit, setNewKeyRateLimit] = useState('60 req/min');
  const [assignedUserId, setAssignedUserId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal hiển thị raw key vừa tạo
  const [createdKey, setCreatedKey] = useState<ApiKeyItem | null>(null);
  const [copiedRawKey, setCopiedRawKey] = useState(false);

  // Maintenance state & Log Modal state
  const [maintenance, setMaintenance] = useState<MaintenanceStatus | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [copiedLogJson, setCopiedLogJson] = useState(false);
  const [copiedCodeSnippet, setCopiedCodeSnippet] = useState(false);
  const [codeSnippetLang, setCodeSnippetLang] = useState<'python' | 'javascript' | 'curl'>('python');

  const loadMaintenance = useCallback(async () => {
    try {
      const res = await systemApi.getMaintenance();
      if (res.data) setMaintenance(res.data);
    } catch {
      // ignore
    }
  }, []);

  // Tải danh sách keys (Admin có thể xem tất cả hoặc lọc theo tài khoản)
  const loadKeys = useCallback(async (userId = selectedUserId) => {
    setIsLoading(true);
    try {
      const res = await apiKeysApi.getKeys(isAdmin ? userId : undefined);
      if (res.data) setKeys(res.data);
    } catch (err) {
      console.warn(err);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, selectedUserId]);

  // Tải danh sách tài khoản nếu là Admin
  useEffect(() => {
    if (isAdmin) {
      apiClient.get<AccountsData>('/accounts')
        .then((res) => {
          if (res.data?.users) {
            setAccounts(res.data.users);
          }
        })
        .catch(console.warn);

      // Tải danh sách NCC cho Admin
      setIsLoadingProviders(true);
      providersApi.getAll()
        .then((res) => {
          if (res.data) setProviders(res.data);
        })
        .catch(console.warn)
        .finally(() => setIsLoadingProviders(false));
    }
  }, [isAdmin]);

  useEffect(() => {
    loadKeys(selectedUserId);
    loadMaintenance();
  }, [loadKeys, selectedUserId, loadMaintenance]);

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
          loadKeys(selectedUserId);
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
      const res = await apiKeysApi.createKey(
        newKeyName.trim(),
        newKeyRateLimit,
        isAdmin && assignedUserId ? assignedUserId : undefined
      );
      if (res.success && res.data) {
        setCreatedKey(res.data);
        setIsCreateModalOpen(false);
        setNewKeyName('');
        setAssignedUserId('');
        loadKeys(selectedUserId);
      }
    } catch (err: any) {
      alert.error('Lỗi khởi tạo API Key', err?.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredKeys = useMemo(() => {
    return keys.filter((k) => {
      const matchSearch =
        k.name.toLowerCase().includes(search.toLowerCase()) ||
        k.key_prefix.toLowerCase().includes(search.toLowerCase()) ||
        (k.user_email && k.user_email.toLowerCase().includes(search.toLowerCase())) ||
        (k.user_name && k.user_name.toLowerCase().includes(search.toLowerCase()));

      return matchSearch;
    });
  }, [keys, search]);

  const activeKeysCount = useMemo(() => {
    return keys.filter((k) => k.status === 'active' || !k.status).length;
  }, [keys]);

  const uniqueOwnersCount = useMemo(() => {
    const ownerIds = new Set(keys.map((k) => k.user_id).filter(Boolean));
    return ownerIds.size;
  }, [keys]);

  // Table Columns
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
            <span className="text-[10px] text-slate-400 font-mono">ID: {record.id}</span>
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
          <span className="font-mono bg-slate-100 border border-slate-200/80 px-2 py-1 rounded text-xs text-slate-700 font-bold">
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
    // Cột Tài Khoản Sở Hữu: CHỈ hiển thị khi người dùng là Admin/SuperAdmin
    ...(isAdmin
      ? [
          {
            key: 'owner',
            title: 'Tài Khoản Sở Hữu',
            render: (_: any, record: ApiKeyItem) => {
              const isOwner = record.user_id === user?.id;
              return (
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 text-xs">
                      {record.user_name || 'Khách vãng lai'}
                    </span>
                    {isOwner && (
                      <span className="text-[9px] bg-brand-50 text-brand-700 px-1.5 py-0.2 rounded font-bold border border-brand-200">
                        Của tôi
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {record.user_email || record.user_id || 'Chưa gán email'}
                  </span>
                  {record.user_role && (
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                      {record.user_role === 'SUPER_ADMIN'
                        ? '👑 Super Admin'
                        : record.user_role === 'ADMIN'
                        ? '🛡️ Quản trị viên'
                        : '👤 Khách hàng'}
                    </span>
                  )}
                </div>
              );
            },
          },
        ]
      : []),
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
        <span className="text-slate-600 font-medium text-xs bg-slate-50 px-2 py-0.5 rounded border border-slate-200 font-mono">
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
      title: 'Ngày Tạo',
      dataIndex: 'created_at',
      render: (val) => <span className="text-slate-500 text-xs font-mono">{val}</span>,
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
              {isAdmin ? 'Quản Trị Toàn Quyền' : 'Cổng Khách Hàng'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isAdmin
              ? 'Super Admin quản lý tập trung tất cả khóa API của khách hàng và khóa kết nối nhà cung cấp hạ tầng.'
              : 'Tạo và quản lý khóa API Bearer Token để kết nối website, ứng dụng của bạn tới Cụm AI Image Generator.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            leftIcon={<RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />}
            onClick={() => {
              loadKeys(selectedUserId);
              loadMaintenance();
            }}
          >
            Làm mới
          </Button>
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus size={15} />}
            onClick={() => {
              setAssignedUserId(isAdmin ? '' : (user?.id || ''));
              setIsCreateModalOpen(true);
            }}
            className="bg-brand-500 hover:bg-brand-600 text-white font-bold shadow-md shadow-brand-500/20"
          >
            + Tạo API Key Mới
          </Button>
        </div>
      </div>

      {/* TABS SELECTOR (CHỈ HIỂN THỊ KHI LÀ ADMIN / SUPER ADMIN) */}
      {isAdmin && (
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('customer_keys')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'customer_keys'
                ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/30'
                : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <KeyRound size={15} />
            <span>API Keys Cổng Khách Hàng</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'customer_keys' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {keys.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('provider_keys')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'provider_keys'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Server size={15} className="text-amber-400" />
            <span>Khóa Gốc Nhà Cung Cấp (Upstream NCC)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Admin Only
            </span>
          </button>
        </div>
      )}

      {/* NỘI DUNG TAB 1: API KEYS CỔNG KHÁCH HÀNG */}
      {activeTab === 'customer_keys' && (
        <>
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
                  Khách hàng sử dụng khóa <code>mf_live_sec_...</code> kết nối trực tiếp qua endpoint <code>POST /v1/images/generations</code>.
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

          {/* Cổng API Status & Bảo Vệ Số Dư Card */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              maintenance?.is_maintenance
                ? 'bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50/50 border-amber-300'
                : 'bg-gradient-to-r from-emerald-500/5 via-emerald-50/30 to-slate-50/60 border-emerald-200/80'
            }`}
          >
            <div className="flex items-start sm:items-center gap-3.5">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                  maintenance?.is_maintenance
                    ? 'bg-amber-100 text-amber-700 border-amber-300 animate-pulse'
                    : 'bg-emerald-100 text-emerald-700 border-emerald-300'
                }`}
              >
                {maintenance?.is_maintenance ? <Wrench size={22} /> : <ShieldCheck size={22} />}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider flex items-center gap-1.5 ${
                      maintenance?.is_maintenance
                        ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
                        : 'bg-emerald-500 text-white border-emerald-600'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    {maintenance?.is_maintenance ? 'CỔNG API BẢO TRÌ (NGƯNG NHẬN BẮN)' : 'CỔNG API ONLINE (HOẠT ĐỘNG)'}
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    {maintenance?.is_maintenance
                      ? 'Tạm ngưng nhận request tạo ảnh từ bot/khách'
                      : 'Sẵn sàng tiếp nhận request 24/7'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                  {maintenance?.is_maintenance ? (
                    <>
                      <strong>Thông báo:</strong>{' '}
                      <span className="text-amber-900 font-semibold">
                        {maintenance.message || 'Hệ thống đang bảo trì nâng cấp máy chủ.'}
                      </span>
                      . Cổng API phản hồi mã <strong>HTTP 503</strong>. Tiền ví của quý khách{' '}
                      <strong className="text-emerald-700">được bảo toàn 100% (không trừ tiền)</strong>. Vui lòng bấm bên phải để xem log & dừng bot.
                    </>
                  ) : (
                    <>
                      Cổng API đang kết nối ổn định. Bấm xem mẫu phản hồi HTTP 503 khi bảo trì để lập trình bot tự động nhận diện và ngừng bắn, tránh lãng phí request.
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
              <Button
                variant={maintenance?.is_maintenance ? 'primary' : 'outline'}
                size="sm"
                leftIcon={<Terminal size={14} />}
                onClick={() => setIsLogModalOpen(true)}
                className={
                  maintenance?.is_maintenance
                    ? 'bg-amber-600 hover:bg-amber-700 text-white font-bold border-amber-600 shadow-sm'
                    : 'border-slate-300 text-slate-700 hover:bg-white font-bold'
                }
              >
                📋 Xem Mẫu Log Phản Hồi 503 & Dừng Bot
              </Button>
            </div>
          </div>

          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card padding="md" className="border-l-4 border-l-brand-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {isAdmin ? 'Tổng API Keys Hệ Thống' : 'Số Khóa Của Bạn'}
                  </p>
                  <h3 className="text-2xl font-black text-slate-900 mt-1">{keys.length}</h3>
                  <p className="text-[11px] text-slate-400 mt-1">Đã cấp phát kết nối</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-orange-50 text-brand-600 flex items-center justify-center shrink-0">
                  <KeyRound size={20} />
                </div>
              </div>
            </Card>

            <Card padding="md" className="border-l-4 border-l-emerald-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Đang Hoạt Động</p>
                  <h3 className="text-2xl font-black text-emerald-700 mt-1">{activeKeysCount}</h3>
                  <p className="text-[11px] text-emerald-600 font-semibold mt-1">Sẵn sàng nhận request</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck size={20} />
                </div>
              </div>
            </Card>

            {isAdmin ? (
              <Card padding="md" className="border-l-4 border-l-indigo-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Khách Hàng Có Key</p>
                    <h3 className="text-2xl font-black text-indigo-700 mt-1">{uniqueOwnersCount}</h3>
                    <p className="text-[11px] text-indigo-600 font-semibold mt-1">Tài khoản tích hợp API</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Users size={20} />
                  </div>
                </div>
              </Card>
            ) : (
              <Card padding="md" className="border-l-4 border-l-sky-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Định Mức Tốc Độ</p>
                    <h3 className="text-2xl font-black text-sky-700 mt-1">60 req/min</h3>
                    <p className="text-[11px] text-slate-400 mt-1">Chuẩn bảo vệ chống nghẽn</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                    <Zap size={20} />
                  </div>
                </div>
              </Card>
            )}

            <Card padding="md" className="border-l-4 border-l-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Models Khả Dụng</p>
                  <h3 className="text-xl font-black text-purple-700 mt-1 whitespace-nowrap">4 Models AI</h3>
                  <p className="text-[11px] text-purple-600 font-semibold mt-1 whitespace-nowrap">2.5 Flare • Sunburst • GPT 2 • Banana</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Lock size={20} />
                </div>
              </div>
            </Card>
          </div>

          {/* Filter & Search Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  isAdmin
                    ? 'Tìm kiếm API Key theo tên, mã token, email khách hàng...'
                    : 'Tìm kiếm API Key của bạn theo tên, token prefix...'
                }
                className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 shadow-2xs transition-all"
              />
            </div>

            {/* Bộ lọc tài khoản: DÀNH RIÊNG CHO ADMIN / SUPER ADMIN */}
            {isAdmin && (
              <div className="w-full sm:w-72 shrink-0">
                <select
                  value={selectedUserId}
                  onChange={(e) => {
                    setSelectedUserId(e.target.value);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 shadow-2xs transition-all"
                >
                  <option value="all">📂 Tất cả tài khoản ({keys.length} keys)</option>
                  {user && <option value={user.id}>⭐ Khóa của tôi ({user.email})</option>}
                  <optgroup label="Tài khoản khách hàng">
                    {accounts
                      .filter((acc) => acc.id !== user?.id)
                      .map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          👤 {acc.full_name} ({acc.email})
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>
            )}
          </div>

          {/* Table API Keys */}
          <Table<ApiKeyItem>
            columns={columns}
            data={filteredKeys}
            loading={isLoading}
            emptyText={
              isAdmin && selectedUserId !== 'all'
                ? 'Tài khoản này chưa có API Key nào. Hãy bấm "+ Tạo API Key Mới" để cấp khóa cho khách!'
                : 'Chưa có API Key nào được tạo. Hãy bấm "+ Tạo API Key Mới" để bắt đầu kết nối!'
            }
            pagination={{ pageSize: 8 }}
          />
        </>
      )}

      {/* NỘI DUNG TAB 2: KHÓA GỐC NHÀ CUNG CẤP (CHỈ ADMIN / SUPER ADMIN THẤY) */}
      {isAdmin && activeTab === 'provider_keys' && (
        <div className="space-y-6">
          {/* Security Banner Cảnh Báo Bảo Mật Tuyệt Đối */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white shadow-lg border border-amber-500/30 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
                <Shield size={22} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span>Cổng Cách Ly Bảo Mật Nhà Cung Cấp (Upstream NCC)</span>
                  <span className="text-[10px] bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                    Độc Quyền Quản Trị Viên
                  </span>
                </h3>
                <p className="text-xs text-amber-200/80 mt-0.5">
                  Bảo vệ 100% không để lộ API Key gốc và giá vốn của nhà cung cấp ra bên ngoài.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck size={14} /> Chống đục API NCC
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Khách hàng chỉ được cấp API Key dạng <code>mf_live_sec_...</code> trên hệ thống máy chủ của bạn. Mọi request đều được proxy trung chuyển.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Lock size={14} /> Bảo mật giá vốn 75đ
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Giá gốc của nhà cung cấp (75đ/ảnh) hoàn toàn bị ẩn. Khách hàng chỉ thấy và thanh toán theo giá niêm yết (150đ/ảnh).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="font-bold text-sky-400 flex items-center gap-1.5">
                  <Zap size={14} /> Local CDN Caching
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Toàn bộ ảnh sinh ra đều được máy chủ tải về lưu nội bộ (Local Storage), không làm lộ tên miền CDN của nhà cung cấp.
                </p>
              </div>
            </div>
          </div>

          {/* Upstream Provider Cards */}
          {isLoadingProviders ? (
            <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
              <RefreshCw className="animate-spin text-brand-500" size={28} />
              <span className="ml-3 text-xs font-semibold text-slate-500">Đang kiểm tra kết nối nhà cung cấp...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {providers.map((p) => {
                const isRevealed = !!revealedProviderKeyIds[p.id];
                return (
                  <div
                    key={p.id}
                    className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shrink-0">
                          <Server size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-slate-900 text-sm">{p.name}</h4>
                            {p.is_primary && (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Chính thức (Primary)
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 font-mono mt-0.5 block">{p.provider_code}</span>
                        </div>
                      </div>
                      <Badge variant={p.status === 'ONLINE' ? 'success' : 'dark'}>
                        {p.status === 'ONLINE' ? 'Đang kết nối' : 'Dự phòng'}
                      </Badge>
                    </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400">Endpoint Máy Chủ:</span>
                      <span className="font-mono font-semibold text-slate-800 text-[11px] truncate max-w-[200px]">
                        {p.base_url}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400">Giá Vốn Nhập:</span>
                      <span className="font-bold text-amber-600">
                        {p.cost_per_image ? `${p.cost_per_image} đ/ảnh` : '75 đ/ảnh'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200/50">
                      <span className="text-slate-400">Khóa API Gốc (Upstream):</span>
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {isRevealed ? (p.api_key_masked || 'sk-••••••••') : '••••••••••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setRevealedProviderKeyIds((prev) => ({ ...prev, [p.id]: !prev[p.id] }))
                          }
                          className="text-slate-400 hover:text-slate-700 p-1"
                          title={isRevealed ? 'Ẩn khóa' : 'Xem khóa'}
                        >
                          {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-[11px] text-slate-400 font-medium">
                      Thời gian phản hồi: ~25ms
                    </span>
                    <Link to="/app/providers">
                      <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={13} />}>
                        Cấu hình chi tiết
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link to="/app/providers">
              <Button variant="outline" size="md" leftIcon={<Server size={15} />}>
                Mở Trang Quản Lý NCC Toàn Diện
              </Button>
            </Link>
          </div>
        </div>
      )}

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
                Cấp quyền kết nối tới Cổng Model AI gpt-image-2 (Mã khóa <code>mf_live_sec_...</code>)
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
          {/* Admin chọn gán cho tài khoản nào */}
          {isAdmin && accounts.length > 0 && (
            <div>
              <label className="block font-bold text-slate-800 mb-1.5">
                Tài khoản sở hữu API Key <span className="text-brand-600">*</span>:
              </label>
              <select
                value={assignedUserId}
                onChange={(e) => setAssignedUserId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 shadow-2xs text-xs font-semibold transition-all"
              >
                <option value="">⭐ Chính tôi (Super Admin - {user?.email})</option>
                <optgroup label="Cấp cho tài khoản khách hàng">
                  {accounts
                    .filter((acc) => acc.id !== user?.id)
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        👤 {acc.full_name} ({acc.email})
                      </option>
                    ))}
                </optgroup>
              </select>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Super Admin có thể tạo sẵn Key và bàn giao cho khách hàng cụ thể.
              </span>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-800 mb-1.5">
              Tên nhận diện API Key <span className="text-rose-500">*</span>:
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
              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 shadow-2xs text-xs transition-all font-medium"
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
                Hãy lưu lại khóa bí mật này ngay bây giờ
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
              <strong>Quan trọng:</strong> Vì lý do an toàn, chuỗi khóa bí mật (Secret Key) này{' '}
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
            <div><strong>Tên nhận diện:</strong> {createdKey?.name}</div>
            <div><strong>Prefix Token:</strong> <code className="font-bold text-slate-800">{createdKey?.key_prefix}</code></div>
            {createdKey?.user_email && (
              <div><strong>Chủ sở hữu:</strong> {createdKey.user_name} ({createdKey.user_email})</div>
            )}
            <div><strong>Giới hạn tốc độ:</strong> {createdKey?.rate_limit}</div>
          </div>
        </div>
      </Modal>

      {/* Modal Nhật Ký Phản Hồi API Khi Bảo Trì & Hướng Dẫn Tạm Dừng Bot */}
      <Modal
        isOpen={isLogModalOpen}
        onClose={() => {
          setIsLogModalOpen(false);
          setCopiedLogJson(false);
          setCopiedCodeSnippet(false);
        }}
        size="lg"
        title={
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-300 shrink-0">
              <Terminal size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-slate-900">
                  Nhật Ký Phản Hồi API Khi Bảo Trì & Hướng Dẫn Dừng Bot
                </span>
                <span className="text-[10px] bg-rose-50 text-rose-600 font-mono font-bold px-2 py-0.5 rounded border border-rose-200">
                  HTTP 503
                </span>
              </div>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                Cơ chế phản hồi chuẩn để bot/tool nhận diện dừng bắn và bảo toàn số dư ví 100%
              </p>
            </div>
          </div>
        }
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
              <ShieldCheck size={16} />
              <span>Cam kết: Tiền trong ví được giữ nguyên 100% (không trừ tiền)</span>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setIsLogModalOpen(false);
                setCopiedLogJson(false);
                setCopiedCodeSnippet(false);
              }}
            >
              Đã hiểu & Đóng
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          {/* Status Box */}
          <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                <span>Quy trình bảo vệ số dư khi máy chủ bảo trì:</span>
              </div>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 bg-white text-amber-800 rounded border border-amber-300 shadow-2xs">
                balance_preserved: true
              </span>
            </div>
            <p className="text-[11px] text-amber-800/90 leading-relaxed">
              Khi Super Admin kích hoạt chế độ bảo trì, mọi request từ bot/tool của bạn gửi tới cổng <code>POST /v1/images/generations</code> sẽ bị từ chối ngay tại tầng cổng vào (Step 0) với mã lỗi <strong>HTTP 503</strong>. Hệ thống <strong>hoàn toàn không trừ tiền</strong> trong ví của bạn.
            </p>
          </div>

          {/* Response Headers & JSON Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Code2 size={14} className="text-brand-600" />
                <span>1. Cấu trúc phản hồi API (HTTP 503 Payload Chuẩn OpenAI):</span>
              </label>
              <Button
                variant="outline"
                size="sm"
                leftIcon={copiedLogJson ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                onClick={() => {
                  const samplePayload = JSON.stringify(
                    {
                      error: {
                        message: maintenance?.message || "Hệ thống API đang trong thời gian bảo trì nâng cấp. Vui lòng tạm ngưng gửi request từ bot/tool tự động.",
                        type: "maintenance_error",
                        code: "system_under_maintenance",
                        status: 503,
                        balance_preserved: true,
                        suggestion: "Vui lòng tạm ngưng gửi request từ bot/tool tự động để bảo vệ tiến trình. Số dư ví của quý khách được bảo toàn 100% (không trừ tiền)."
                      }
                    },
                    null,
                    2
                  );
                  navigator.clipboard.writeText(samplePayload);
                  setCopiedLogJson(true);
                  alert.toast('Đã sao chép mẫu log phản hồi 503!', 'success');
                  setTimeout(() => setCopiedLogJson(false), 2000);
                }}
                className="text-[11px] h-7 px-2.5"
              >
                {copiedLogJson ? 'Đã sao chép' : 'Sao chép JSON'}
              </Button>
            </div>

            <div className="bg-slate-900 rounded-xl p-3 font-mono text-[11px] text-slate-200 overflow-x-auto border border-slate-800 shadow-inner space-y-2">
              <div className="text-rose-400 font-bold border-b border-slate-800 pb-1.5 flex items-center justify-between">
                <span>HTTP/1.1 503 Service Unavailable</span>
                <span className="text-slate-400 text-[10px]">Retry-After: 300 | x-balance-preserved: true</span>
              </div>
              <pre className="text-amber-300 leading-relaxed whitespace-pre-wrap">
{`{
  "error": {
    "message": "${maintenance?.message || 'Hệ thống API đang trong thời gian bảo trì nâng cấp... Nó sẽ tự động phục hồi sau ít phút.'}",
    "type": "maintenance_error",
    "code": "system_under_maintenance",
    "status": 503,
    "balance_preserved": true,
    "suggestion": "Vui lòng tạm ngưng gửi request từ bot/tool tự động để bảo vệ tiến trình. Số dư ví của quý khách được bảo toàn 100% (không trừ tiền)."
  }
}`}
              </pre>
            </div>
          </div>

          {/* Code Snippet for Bot Shutdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Terminal size={14} className="text-indigo-600" />
                <span>2. Đoạn mã mẫu giúp Bot / Tool tự động dừng bắn khi gặp 503:</span>
              </label>

              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setCodeSnippetLang('python')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                    codeSnippetLang === 'python'
                      ? 'bg-white text-indigo-600 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Python
                </button>
                <button
                  type="button"
                  onClick={() => setCodeSnippetLang('javascript')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                    codeSnippetLang === 'javascript'
                      ? 'bg-white text-indigo-600 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Node.js / JS
                </button>
                <button
                  type="button"
                  onClick={() => setCodeSnippetLang('curl')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                    codeSnippetLang === 'curl'
                      ? 'bg-white text-indigo-600 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  cURL
                </button>
              </div>
            </div>

            <div className="relative bg-slate-900 rounded-xl p-3.5 font-mono text-[11px] text-slate-200 overflow-x-auto border border-slate-800 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  let snippet = '';
                  if (codeSnippetLang === 'python') {
                    snippet = `import requests, time

response = requests.post(
    "https://api.yourdomain.vn/v1/images/generations",
    headers={"Authorization": "Bearer mf_live_sec_..."},
    json={"prompt": "A cute puppy", "model": "gpt-image-2.5-flare"}
)

if response.status_code == 503:
    err_data = response.json().get("error", {})
    if err_data.get("code") == "system_under_maintenance":
        print("⚠️ HỆ THỐNG ĐANG BẢO TRÌ! Dừng gửi lệnh bắn ngay lập tức.")
        print("🛡️ Tiền ví được bảo toàn 100%:", err_data.get("suggestion"))
        # Tạm dừng tiến trình bot (Sleep hoặc Exit loop)
        time.sleep(300)
`;
                  } else if (codeSnippetLang === 'javascript') {
                    snippet = `const response = await fetch("https://api.yourdomain.vn/v1/images/generations", {
  method: "POST",
  headers: {
    "Authorization": "Bearer mf_live_sec_...",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ prompt: "A cute puppy", model: "gpt-image-2.5-flare" })
});

if (response.status === 503) {
  const result = await response.json();
  if (result.error?.code === "system_under_maintenance") {
    console.warn("⚠️ API Đang Bảo Trì:", result.error.message);
    console.log("🛡️ Số dư ví được bảo toàn 100%. Tạm dừng gửi request.");
    // Dừng tiến trình cron / worker
  }
}`;
                  } else {
                    snippet = `curl -i -X POST https://api.yourdomain.vn/v1/images/generations \\
  -H "Authorization: Bearer mf_live_sec_..." \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "A cute puppy", "model": "gpt-image-2.5-flare"}'`;
                  }
                  navigator.clipboard.writeText(snippet);
                  setCopiedCodeSnippet(true);
                  alert.toast('Đã sao chép đoạn code mẫu!', 'success');
                  setTimeout(() => setCopiedCodeSnippet(false), 2000);
                }}
                className="absolute top-2.5 right-2.5 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-sans font-bold flex items-center gap-1 border border-slate-700 transition-colors"
              >
                {copiedCodeSnippet ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copiedCodeSnippet ? 'Đã chép' : 'Sao chép'}</span>
              </button>

              <pre className="text-emerald-300 leading-relaxed whitespace-pre-wrap pr-16">
                {codeSnippetLang === 'python' &&
`import requests, time

response = requests.post(
    "https://api.yourdomain.vn/v1/images/generations",
    headers={"Authorization": "Bearer mf_live_sec_..."},
    json={"prompt": "A cute puppy", "model": "gpt-image-2.5-flare"}
)

if response.status_code == 503:
    err_data = response.json().get("error", {})
    if err_data.get("code") == "system_under_maintenance":
        print("⚠️ HỆ THỐNG ĐANG BẢO TRÌ! Dừng gửi lệnh bắn ngay lập tức.")
        print("🛡️ Tiền ví được bảo toàn 100%:", err_data.get("suggestion"))
        # Tạm dừng bot để tránh lãng phí request
        time.sleep(300)`}

                {codeSnippetLang === 'javascript' &&
`const response = await fetch("https://api.yourdomain.vn/v1/images/generations", {
  method: "POST",
  headers: {
    "Authorization": "Bearer mf_live_sec_...",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ prompt: "A cute puppy", model: "gpt-image-2.5-flare" })
});

if (response.status === 503) {
  const result = await response.json();
  if (result.error?.code === "system_under_maintenance") {
    console.warn("⚠️ API Đang Bảo Trì:", result.error.message);
    console.log("🛡️ Số dư ví được bảo toàn 100%. Tạm dừng gửi request.");
    // Dừng tiến trình worker
  }
}`}

                {codeSnippetLang === 'curl' &&
`curl -i -X POST https://api.yourdomain.vn/v1/images/generations \\
  -H "Authorization: Bearer mf_live_sec_..." \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "A cute puppy", "model": "gpt-image-2.5-flare"}'`}
              </pre>
            </div>
          </div>

          {/* Super Admin Action note */}
          {isAdmin && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-600">
                Bạn là <strong>{isSuperAdmin ? 'Super Admin' : 'Admin'}</strong>. Bạn có thể bật / tắt chế độ bảo trì trực tiếp tại nút cờ lê trên thanh Header.
              </span>
              <span className="font-bold text-brand-600 font-mono">
                Status: {maintenance?.is_maintenance ? 'MAINTENANCE_ACTIVE' : 'SYSTEM_ONLINE'}
              </span>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
