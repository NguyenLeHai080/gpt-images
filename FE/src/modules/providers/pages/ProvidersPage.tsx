import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from '../../../core/components/Card/Card';
import { Button } from '../../../core/components/Button/Button';
import { Badge } from '../../../core/components/Badge/Badge';
import { Table, type Column } from '../../../core/components/Table';
import {
  Server,
  Plus,
  RefreshCw,
  Activity,
  DollarSign,
  Layers,
  Search,
  Zap,
  Check,
  Copy,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  LayoutList,
  LayoutGrid,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { alert } from '../../../core/alert';
import { useAuth } from '../../../core/hooks/useAuth';
import { providersApi } from '../api';
import type {
  AIProvider,
  ProviderStats,
  CreateProviderInput,
  UpdateProviderInput
} from '../types';
import { ProviderCard } from '../components/ProviderCard';
import { ProviderModal } from '../components/ProviderModal';
import { FailoverSettingsCard } from '../components/FailoverSettingsCard';

export const ProvidersPage: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = isSuperAdmin || user?.role === 'ADMIN';

  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [stats, setStats] = useState<ProviderStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [testingPingId, setTestingPingId] = useState<string | null>(null);

  // Search & Filter & View
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'standby'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Key reveal and copy state for table
  const [revealedKeyIds, setRevealedKeyIds] = useState<Record<string, boolean>>({});
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [copiedUrlId, setCopiedUrlId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [providerToEdit, setProviderToEdit] = useState<AIProvider | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatVND = (num: number) =>
    new Intl.NumberFormat('vi-VN').format(num) + ' đ';

  const loadData = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    try {
      const [provRes, statsRes] = await Promise.all([
        providersApi.getAll(),
        providersApi.getStats()
      ]);
      if (provRes.success && provRes.data) {
        setProviders(provRes.data);
      }
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (err: any) {
      console.warn('Lỗi tải dữ liệu NCC:', err);
      if (!quiet) {
        alert.error('Lỗi tải dữ liệu', err?.message || 'Không thể kết nối đến máy chủ.');
      }
    } finally {
      if (!quiet) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Set Primary
  const handleSetPrimary = async (id: string) => {
    const target = providers.find((p) => p.id === id);
    const confirmed = await alert.confirm({
      title: 'Chuyển Đổi NCC Chính?',
      text: `Bạn có chắc muốn đặt '${target?.name || id}' làm Nhà Cung Cấp chính? Mọi yêu cầu sinh ảnh AI sẽ ngay lập tức được định tuyến qua cổng này.`,
      confirmButtonText: 'Đồng ý chuyển đổi',
      cancelButtonText: 'Hủy bỏ'
    });

    if (!confirmed) return;

    try {
      await providersApi.setPrimary(id);
      await loadData(true);
    } catch (err: any) {
      alert.error('Chuyển đổi thất bại', err?.message || 'Không thể đổi NCC chính.');
    }
  };

  // Handle Test Ping
  const handleTestPing = async (id: string) => {
    setTestingPingId(id);
    try {
      const res = await providersApi.testConnection(id);
      if (res.success && res.data) {
        if (res.data.is_connected) {
          alert.toast(`Ping thành công: ${res.data.latency_ms}ms`, 'success');
        } else {
          alert.warning('Cảnh báo kết nối', res.data.message);
        }
        await loadData(true);
      }
    } catch (err: any) {
      alert.error('Ping thất bại', err?.message || 'Không thể kiểm tra kết nối.');
    } finally {
      setTestingPingId(null);
    }
  };

  // Handle Ping All
  const handlePingAll = async () => {
    for (const p of providers) {
      await handleTestPing(p.id);
    }
  };

  // Handle Delete
  const handleDelete = async (id: string, name: string) => {
    const confirmed = await alert.confirm({
      title: 'Xóa Nhà Cung Cấp?',
      text: `Hành động này sẽ gỡ bỏ vĩnh viễn cấu hình của '${name}'. Bạn có chắc chắn không?`,
      confirmButtonText: 'Xác nhận xóa',
      cancelButtonText: 'Giữ lại',
      isDanger: true
    });

    if (!confirmed) return;

    try {
      await providersApi.delete(id);
      await loadData(true);
    } catch (err: any) {
      alert.error('Xóa thất bại', err?.message || 'Không thể xóa nhà cung cấp.');
    }
  };

  const handleCopyKey = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    alert.toast('Đã sao chép API Key', 'success');
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleCopyUrl = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrlId(id);
    alert.toast('Đã sao chép Endpoint URL', 'success');
    setTimeout(() => setCopiedUrlId(null), 2000);
  };

  const toggleKeyReveal = (id: string) => {
    setRevealedKeyIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtered Providers
  const filteredProviders = useMemo(() => {
    return providers.filter((p) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.base_url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.default_model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.provider_code.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
          ? p.is_active
          : !p.is_active;

      return matchesSearch && matchesStatus;
    });
  }, [providers, searchQuery, statusFilter]);

  // Primary Provider
  const primaryProvider = providers.find((p) => p.is_primary);

  // Table Columns Definition - Luôn giữ 1 dòng (whitespace-nowrap) không cho rớt dòng
  const columns: Column<AIProvider>[] = [
    {
      key: 'provider',
      title: 'Cổng & Nhà Cung Cấp',
      render: (_, record) => (
        <div className="flex items-center gap-2.5 whitespace-nowrap">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              record.is_primary
                ? 'bg-gradient-to-tr from-brand-500 to-amber-500 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            <Server size={14} />
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="font-extrabold text-slate-900 text-xs hover:text-brand-600 transition-colors">
              {record.name}
            </span>
            {record.is_primary && (
              <Badge variant="brand">Primary</Badge>
            )}
            <span className="font-mono text-[10px] text-slate-400">
              ({record.provider_code})
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'base_url',
      title: 'Cổng Base URL',
      render: (_, record) => (
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="font-mono text-xs text-slate-800 select-all">
            {record.base_url}
          </span>
          <button
            onClick={() => handleCopyUrl(record.id, record.base_url)}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
            title="Copy URL"
          >
            {copiedUrlId === record.id ? (
              <Check size={13} className="text-emerald-600" />
            ) : (
              <Copy size={13} />
            )}
          </button>
        </div>
      ),
    },
    {
      key: 'api_key',
      title: 'API Key (Bearer)',
      render: (_, record) => {
        const isRevealed = revealedKeyIds[record.id];
        const keyText = isRevealed && record.api_key ? record.api_key : record.api_key_masked;
        return (
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="font-mono text-xs text-slate-700 select-all">
              {keyText}
            </span>
            {record.api_key && (
              <button
                onClick={() => toggleKeyReveal(record.id)}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                title={isRevealed ? 'Ẩn key' : 'Hiện key'}
              >
                {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            )}
            <button
              onClick={() => handleCopyKey(record.id, record.api_key || record.api_key_masked)}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
              title="Copy API Key"
            >
              {copiedKeyId === record.id ? (
                <Check size={13} className="text-emerald-600" />
              ) : (
                <Copy size={13} />
              )}
            </button>
          </div>
        );
      },
    },
    {
      key: 'models',
      title: 'Model Mặc Định & Hỗ Trợ',
      render: (_, record) => (
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="font-mono text-[10px] font-bold text-brand-700 bg-brand-50 border border-brand-200 px-1.5 py-0.5 rounded flex items-center gap-1">
            <Sparkles size={10} />
            {record.default_model}
          </span>
          {record.models_supported
            .filter((m) => m !== record.default_model)
            .slice(0, 3)
            .map((m) => (
              <span
                key={m}
                className="font-mono text-[10px] text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded"
              >
                {m}
              </span>
            ))}
          {record.models_supported.length > 4 && (
            <span className="text-[10px] text-slate-400 font-mono">
              +{record.models_supported.length - 4}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'cost',
      title: 'Giá Vốn / Ảnh',
      align: 'right',
      render: (_, record) => (
        <div className="text-right whitespace-nowrap">
          <span className="font-mono font-bold text-slate-900 text-xs">
            {formatVND(record.cost_per_image)}
          </span>
        </div>
      ),
    },
    {
      key: 'latency',
      title: 'Độ Trễ (Ping)',
      align: 'center',
      render: (_, record) => (
        <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
            <Activity size={12} className="text-brand-500" />
            {record.latency_ms} ms
          </span>
          <button
            onClick={() => handleTestPing(record.id)}
            disabled={testingPingId === record.id}
            className="p-1 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded transition-colors"
            title="Kiểm tra Ping kết nối"
          >
            <RefreshCw
              size={13}
              className={testingPingId === record.id ? 'animate-spin text-brand-600' : ''}
            />
          </button>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Trạng Thái',
      align: 'center',
      render: (_, record) => (
        <div className="flex justify-center whitespace-nowrap">
          {record.status === 'ONLINE' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Online
            </span>
          ) : record.status === 'STANDBY' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              Dự phòng
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200 whitespace-nowrap">
              <AlertCircle size={11} className="text-red-500" />
              Lỗi kết nối
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      title: 'Thao Tác',
      align: 'right',
      render: (_, record) => (
        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
          {!record.is_primary ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSetPrimary(record.id)}
              className="text-[11px] font-bold text-brand-600 hover:bg-brand-50 hover:border-brand-300 py-1 px-2 whitespace-nowrap"
              title="Đặt làm NCC chính"
            >
              <Zap size={12} className="mr-1 inline" />
              Đặt Chính
            </Button>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 whitespace-nowrap">
              <ShieldCheck size={12} />
              Cổng Chính
            </span>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setProviderToEdit(record);
              setIsModalOpen(true);
            }}
            title="Chỉnh sửa thông số NCC"
            className="text-slate-500 hover:text-slate-900 p-1.5"
          >
            <Edit2 size={14} />
          </Button>

          {!record.is_primary && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDelete(record.id, record.name)}
              title="Xóa nhà cung cấp"
              className="text-slate-400 hover:text-rose-600 p-1.5"
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const handleModalSubmit = async (data: CreateProviderInput | UpdateProviderInput) => {
    setIsSubmitting(true);
    try {
      if (providerToEdit) {
        await providersApi.update(providerToEdit.id, data as UpdateProviderInput);
      } else {
        await providersApi.create(data as CreateProviderInput);
      }
      setIsModalOpen(false);
      await loadData(true);
    } catch (err: any) {
      console.warn('Lưu NCC thất bại:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Quản Lý Nhà Cung Cấp (AI Upstream Providers)
            </h1>
            <span className="text-xs bg-brand-50 text-brand-600 px-2.5 py-0.5 rounded-full font-bold border border-brand-200">
              Cấu hình dịch vụ
            </span>
            {isSuperAdmin && (
              <span className="text-xs bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full font-bold border border-purple-200 flex items-center gap-1">
                <ShieldAlert size={12} />
                Super Admin (Toàn quyền)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quản trị các cổng kết nối AI Upstream (Xompet Gateway, OpenAI), kiểm tra kết nối thời gian thực, chuyển đổi cổng chính và định tuyến mô hình.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            leftIcon={<RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />}
            onClick={() => loadData()}
          >
            Làm mới
          </Button>

          {isAdmin && (
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus size={15} />}
              onClick={() => {
                setProviderToEdit(null);
                setIsModalOpen(true);
              }}
              className="bg-brand-500 hover:bg-brand-600 text-white font-bold shadow-md shadow-brand-500/20"
            >
              + Thêm Nhà Cung Cấp
            </Button>
          )}
        </div>
      </div>

      {/* Primary Gateway Highlight Callout Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-brand-950 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center shrink-0">
            <Server size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-white">
                Cổng Chính Đang Hoạt Động: {primaryProvider?.name || 'Xompet AI Gateway'}
              </h3>
              <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.2 rounded-full font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Đang xử lý
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Chuẩn <strong>Native OpenAI Image API</strong> ({primaryProvider?.base_url || 'https://api.xompet.io.vn/v1'}) • Điểm ảnh thực • Đơn giá vốn 70đ - 75đ • Không phụ thu ảnh tham chiếu.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePingAll}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold text-xs"
            leftIcon={<Activity size={13} />}
          >
            Kiểm tra Ping toàn bộ
          </Button>
        </div>
      </div>

      {/* Financial & Operational Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <Card padding="md" className="border-l-4 border-l-brand-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cổng NCC Chính</p>
              <h3 className="text-xl font-black text-slate-900 mt-1 truncate">
                {primaryProvider?.name || 'Xompet AI Gateway'}
              </h3>
              <p className="text-[11px] text-brand-600 font-bold mt-1 font-mono truncate">
                Model: {primaryProvider?.default_model || 'gpt-image-2.5-flare'}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-orange-50 text-brand-600 flex items-center justify-center shrink-0">
              <Server size={20} />
            </div>
          </div>
        </Card>

        {/* Card 2 */}
        <Card padding="md" className="border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Độ Trễ Phản Hồi (Ping)</p>
              <h3 className="text-xl font-black text-emerald-700 mt-1 font-mono">
                {primaryProvider?.latency_ms ? `${primaryProvider.latency_ms} ms` : `${stats?.avg_latency_ms || 35} ms`}
              </h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <Check size={12} /> Tốc độ cao Native API
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Activity size={20} />
            </div>
          </div>
        </Card>

        {/* Card 3 */}
        <Card padding="md" className="border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Giá Vốn / Ảnh Thành Công</p>
              <h3 className="text-xl font-black text-slate-900 mt-1 font-mono">
                {formatVND(primaryProvider?.cost_per_image || 75)}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Bán: <strong>150đ</strong> (Lãi gộp: <span className="text-emerald-600 font-bold">50% - 53%</span>)
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <DollarSign size={20} />
            </div>
          </div>
        </Card>

        {/* Card 4 */}
        <Card padding="md" className="border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hạ Tầng Cổng Kết Nối</p>
              <h3 className="text-xl font-black text-purple-700 mt-1">
                {providers.length} NCC Sẵn Sàng
              </h3>
              <p className="text-[11px] text-purple-600 font-semibold mt-1">
                {stats?.supported_models_count || 4} Model AI sinh ảnh
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Layers size={20} />
            </div>
          </div>
        </Card>
      </div>

      {/* Toolbar: Search, Status Tabs & View Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên nhà cung cấp, cổng URL, model..."
              className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 shadow-xs transition-all"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({providers.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                statusFilter === 'active'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đang hoạt động ({providers.filter((p) => p.is_active).length})
            </button>
          </div>
        </div>

        {/* View Mode Switcher (Table vs Cards) */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              title="Xem dạng bảng chuẩn"
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-brand-600 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutList size={16} />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              title="Xem dạng thẻ chi tiết"
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white text-brand-600 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Table or Cards */}
      {viewMode === 'table' ? (
        <Card padding="none" className="overflow-hidden border border-slate-200">
          <Table<AIProvider>
            columns={columns}
            data={filteredProviders}
            loading={isLoading}
            emptyText="Không tìm thấy nhà cung cấp nào phù hợp với bộ lọc."
            rowKey="id"
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredProviders.map((p) => (
            <ProviderCard
              key={p.id}
              provider={p}
              onSetPrimary={handleSetPrimary}
              onTestPing={handleTestPing}
              onEdit={(prov) => {
                setProviderToEdit(prov);
                setIsModalOpen(true);
              }}
              onDelete={handleDelete}
              isTestingPing={testingPingId === p.id}
            />
          ))}
        </div>
      )}

      {/* Failover and Gateway Safety Settings */}
      <FailoverSettingsCard />

      {/* Provider Create / Edit Modal */}
      <ProviderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        providerToEdit={providerToEdit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default ProvidersPage;
