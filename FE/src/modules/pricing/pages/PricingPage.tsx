import React, { useState, useEffect, useCallback } from 'react';
import {
  Calculator,
  Zap,
  Sparkles,
  Layers,
  Sliders,
  TrendingUp,
  Settings,
  ShieldAlert,
  Coins,
  DollarSign,
  Info,
  RefreshCw,
  Plus,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../../core/hooks/useAuth';
import { Button } from '../../../core/components/Button/Button';
import { Badge } from '../../../core/components/Badge/Badge';
import { Table, type Column } from '../../../core/components/Table';
import { alert } from '../../../core/alert';
import { pricingApi } from '../api';
import { EditModelPricingModal } from '../components/EditModelPricingModal';
import { CreateModelPricingModal } from '../components/CreateModelPricingModal';
import type { ModelPricingItem, PricingSimulatorResponse } from '../types';

export const PricingPage: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = isSuperAdmin || user?.role === 'ADMIN';

  const [pricingList, setPricingList] = useState<ModelPricingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingModel, setEditingModel] = useState<ModelPricingItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSpecModel, setSelectedSpecModel] = useState<string>('gpt-image-2');

  // Active Tab: 'pricing' | 'specs' | 'simulator'
  const [activeTab, setActiveTab] = useState<'pricing' | 'specs' | 'simulator'>(isAdmin ? 'pricing' : 'specs');

  // Auto-switch to specs if non-admin is on pricing tab
  useEffect(() => {
    if (!isAdmin && activeTab === 'pricing') {
      setActiveTab('specs');
    }
  }, [isAdmin, activeTab]);

  // Simulator State
  const [simModel, setSimModel] = useState<string>('gpt-image-2');
  const [monthlyImages, setMonthlyImages] = useState(3000);
  const [cacheHitRate, setCacheHitRate] = useState(35);
  const [resolution, setResolution] = useState('2k');
  const [quality, setQuality] = useState('high');
  const [simulation, setSimulation] = useState<PricingSimulatorResponse | null>(null);

  const loadPricing = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await pricingApi.getPricing();
      if (res.success && res.data) {
        setPricingList(res.data);
      }
    } catch (err) {
      console.warn('Lỗi tải bảng giá:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const runSimulation = useCallback(async () => {
    try {
      const res = await pricingApi.simulateCost({
        model: simModel || 'gpt-image-2',
        monthly_images: monthlyImages,
        resolution,
        quality,
        cache_hit_rate_pct: cacheHitRate,
      });
      if (res.success && res.data) {
        setSimulation(res.data);
      }
    } catch (err) {
      console.warn('Lỗi tính toán mô phỏng:', err);
    }
  }, [simModel, monthlyImages, cacheHitRate, resolution, quality]);

  useEffect(() => {
    loadPricing();
  }, [loadPricing]);

  useEffect(() => {
    runSimulation();
  }, [runSimulation]);

  const handleDeleteModel = async (item: ModelPricingItem) => {
    if (item.model === 'gpt-image-2' && pricingList.length <= 1) {
      alert.toast('Không thể xóa model mặc định gpt-image-2 khi không còn model nào khác!', 'warning');
      return;
    }

    const confirmed = await alert.confirm({
      title: `Xác nhận xóa model ${item.display_name}?`,
      text: `Bạn có chắc chắn muốn xóa vĩnh viễn cấu hình model "${item.model}" (${item.display_name}) khỏi hệ thống?`,
      confirmButtonText: 'Đồng ý xóa',
      cancelButtonText: 'Hủy bỏ',
      isDanger: true,
    });

    if (!confirmed) return;

    try {
      const res = await pricingApi.deleteModelPricing(item.model);
      if (res.success) {
        alert.toast(`Đã xóa thành công model ${item.display_name}`, 'success');
        setPricingList((prev) => prev.filter((p) => p.model !== item.model));
        if (selectedSpecModel === item.model) {
          setSelectedSpecModel('gpt-image-2');
        }
      } else {
        alert.error('Xóa thất bại', res.message || 'Không thể xóa model');
      }
    } catch (err: any) {
      alert.error('Lỗi kết nối', err?.message || 'Có lỗi xảy ra khi xóa model');
    }
  };

  const formatVND = (num?: number) =>
    num != null ? new Intl.NumberFormat('vi-VN').format(Math.round(num)) + ' đ' : '—';

  // Metrics for Admin
  const gpt2Item = pricingList.find((p) => p.model === 'gpt-image-2') || pricingList[0];
  const currentSpecItem = pricingList.find((p) => p.model === selectedSpecModel) || pricingList[0] || gpt2Item;

  const avgMargin =
    pricingList.length > 0 && isAdmin
      ? Math.round(
          pricingList.reduce((acc, p) => acc + (p.profit_margin_pct ?? 0), 0) / pricingList.length
        )
      : 20;

  // Simulator Financials for Admin
  const simCustomerRevenue = simulation?.estimated_monthly_cost ?? 0;
  const simProvCostUnit = gpt2Item?.provider_cost ?? 120;
  const simCacheHits = Math.round((monthlyImages * Math.min(80, cacheHitRate)) / 100);
  const simCacheMisses = Math.max(0, monthlyImages - simCacheHits);
  const simEstProviderCost = simCacheMisses * simProvCostUnit;
  const simEstNetProfit = simCustomerRevenue - simEstProviderCost;
  const simEstMarginPct =
    simCustomerRevenue > 0 ? (simEstNetProfit / simCustomerRevenue) * 100 : 0;

  // Admin Management Table Columns
  const adminColumns: Column<ModelPricingItem>[] = [
    {
      key: 'model',
      title: 'MÔ HÌNH AI & PHÂN LOẠI',
      dataIndex: 'display_name',
      render: (_, record) => (
        <div className="flex items-center gap-3 py-1">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-brand-500 to-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles size={17} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-xs">{record.display_name}</span>
              <span className="pricing-badge-model text-[11px]">
                {record.model}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block">{record.provider}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'provider_cost',
      title: 'GIÁ VỐN NCC',
      align: 'right',
      render: (_, record) => (
        <div className="text-right py-1">
          <span className="font-mono font-bold text-slate-700 text-xs block">
            {formatVND(record.provider_cost)}
          </span>
          <span className="text-[10px] text-slate-400">trả cho NCC</span>
        </div>
      ),
    },
    {
      key: 'base_price',
      title: 'GIÁ BÁN THU KHÁCH',
      align: 'right',
      render: (_, record) => (
        <div className="text-right py-1">
          <span className="font-mono font-black text-brand-600 text-xs block">
            {formatVND(record.base_price)}
          </span>
          <span className="text-[10px] text-slate-400">trừ ví API</span>
        </div>
      ),
    },
    {
      key: 'token_rate',
      title: 'QUY ĐỔI TOKEN',
      align: 'right',
      render: (_, record) => (
        <div className="text-right py-1">
          <span className="font-mono font-bold text-indigo-700 text-xs block">
            {(record.token_rate ?? 1024).toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400">tokens / request</span>
        </div>
      ),
    },
    {
      key: 'profit',
      title: 'LỜI / LỖ (MARGIN)',
      align: 'right',
      render: (_, record) => {
        const profit = record.profit_amount ?? (record.base_price - (record.provider_cost ?? 0));
        const margin = record.profit_margin_pct ?? 0;
        const isPos = profit > 0;
        return (
          <div className="text-right py-1">
            <span
              className={`font-mono font-black text-xs block ${
                isPos ? 'text-emerald-600' : profit < 0 ? 'text-rose-600' : 'text-slate-600'
              }`}
            >
              {isPos ? `+${formatVND(profit)}` : formatVND(profit)}
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-block ${
                isPos
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {margin.toFixed(1)}% margin
            </span>
          </div>
        );
      },
    },
    {
      key: 'status',
      title: 'TRẠNG THÁI',
      align: 'center',
      render: (_, record) => (
        <div className="flex justify-center">
          <Badge variant={record.status === 'ACTIVE' ? 'success' : 'warning'}>
            {record.status === 'ACTIVE' ? 'Đang kinh doanh' : 'Bảo trì'}
          </Badge>
        </div>
      ),
    },
    {
      key: 'actions',
      title: 'THAO TÁC',
      align: 'right',
      render: (_, record) => (
        <div className="flex items-center justify-end gap-1.5">
          {isSuperAdmin ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Settings size={12} />}
                onClick={() => setEditingModel(record)}
                className="font-bold text-slate-700 hover:text-brand-600 hover:border-brand-300"
              >
                Sửa
              </Button>
              <Button
                variant="danger"
                size="sm"
                leftIcon={<Trash2 size={12} />}
                onClick={() => handleDeleteModel(record)}
                className="font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 border border-rose-200"
              >
                Xóa
              </Button>
            </>
          ) : (
            <span className="text-[11px] text-slate-400 font-medium italic">
              Chỉ xem
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {isAdmin ? 'Bảng Giá Model & Quản Lý Lợi Nhuận' : 'Bảng Giá & Thông Số Model AI'}
            </h1>
            <span className="text-xs bg-brand-50 text-brand-600 px-2.5 py-0.5 rounded-full font-bold border border-brand-200">
              {isAdmin ? 'Cấu hình dịch vụ' : 'Bảng giá dịch vụ'}
            </span>
            {isSuperAdmin ? (
              <span className="text-xs bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full font-bold border border-purple-200 flex items-center gap-1">
                <ShieldAlert size={12} />
                Super Admin (Toàn quyền Thêm/Sửa/Xóa)
              </span>
            ) : isAdmin ? (
              <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-bold border border-slate-200 flex items-center gap-1">
                <ShieldAlert size={12} />
                Admin (Xem dòng tiền)
              </span>
            ) : null}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isAdmin
              ? 'Thiết lập giá vốn trả Nhà cung cấp, giá bán API thu từ khách hàng, số token quy đổi cho các mô hình AI.'
              : 'Xem thông số kỹ thuật, độ phân giải thực tế và công cụ mô phỏng dự toán ngân sách sử dụng các mô hình AI.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            leftIcon={<RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />}
            onClick={loadPricing}
          >
            Làm mới
          </Button>
          {isSuperAdmin && (
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus size={15} />}
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 hover:to-amber-600 text-white font-bold shadow-md shadow-brand-500/20"
            >
              Thêm model mới
            </Button>
          )}
        </div>
      </div>

      {/* Admin Financial Metric Cards */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-orange-50 text-brand-600 flex items-center justify-center shrink-0 border border-orange-100">
              <DollarSign size={20} />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block">
                Giá bán thu khách (gpt-image-2)
              </span>
              <span className="text-lg font-black text-slate-900 font-mono">
                {formatVND(gpt2Item?.base_price ?? 150)}
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <Coins size={20} />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block">
                Giá vốn máy chủ (AI Engine)
              </span>
              <span className="text-lg font-black text-slate-900 font-mono">
                {formatVND(gpt2Item?.provider_cost ?? 120)}
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <TrendingUp size={20} />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block">
                Biên lợi nhuận trung bình
              </span>
              <span className="text-lg font-black text-emerald-600 font-mono">
                +{avgMargin}%
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
              <Zap size={20} />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block">
                Biên độ khi Cache Hit 25ms
              </span>
              <span className="text-lg font-black text-purple-700 font-mono">
                100% Margin (0đ vốn)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Admin Notice Banner on Log Transparency */}
      {isAdmin && (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-50/90 to-indigo-50/90 border border-blue-200/80 flex items-start gap-3">
          <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 leading-relaxed">
            <strong className="text-blue-900">Cơ chế bảo mật dữ liệu tài chính đa tầng:</strong> Tại trang{' '}
            <span className="font-bold text-blue-700">Quản lý Jobs & Nhật ký</span>, các cấp quản trị (Super Admin & Admin) sẽ thấy đầy đủ 3 cột{' '}
            <strong className="text-slate-900">"Giá vốn NCC"</strong>,{' '}
            <strong className="text-brand-600">"Giá thu khách"</strong> và{' '}
            <strong className="text-emerald-600">"Lời/Lỗ"</strong>. Phía Khách hàng (Member / Developer) chỉ nhìn thấy duy nhất{' '}
            <strong>"Chi phí API"</strong> mà bạn đã niêm yết, bảo vệ tuyệt đối chi phí vốn và biên lợi nhuận của hệ thống.
          </div>
        </div>
      )}

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 rounded-xl border border-slate-200 w-fit">
        {isAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab('pricing')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'pricing'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders size={14} className={activeTab === 'pricing' ? 'text-brand-500' : ''} />
            <span>Bảng Cấu Hình Giá & Lợi Nhuận</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('specs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'specs'
              ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers size={14} className={activeTab === 'specs' ? 'text-brand-500' : ''} />
          <span>Thông Số Phân Giải & Tỷ Lệ Token</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'simulator'
              ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calculator size={14} className={activeTab === 'simulator' ? 'text-brand-500' : ''} />
          <span>Mô Phỏng Dự Toán Ngân Sách</span>
        </button>
      </div>

      {/* TAB 1: Bảng Cấu Hình Giá & Lợi Nhuận (Chỉ Quản Trị Viên) */}
      {isAdmin && activeTab === 'pricing' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Sliders size={18} className="text-brand-500" />
                <span>Bảng Niêm Yết & Định Giá Toàn Bộ Model AI</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Bấm vào nút "Sửa giá" để thay đổi chi phí NCC hoặc điều chỉnh giá bán API và số token tương đương.
              </p>
            </div>
          </div>

          <Table<ModelPricingItem>
            columns={adminColumns}
            data={pricingList}
            rowKey="model"
            loading={isLoading}
          />
        </div>
      )}

      {/* TAB 2: Thông Số Phân Giải & Tỷ Lệ Nhân */}
      {activeTab === 'specs' && currentSpecItem && (
        <div className="space-y-5">
          {/* Model Switcher Pills if multiple models */}
          {pricingList.length > 1 && (
            <div className="flex items-center gap-2 flex-wrap bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-500 mr-1">Xem thông số model:</span>
              {pricingList.map((m) => (
                <button
                  key={m.model}
                  type="button"
                  onClick={() => setSelectedSpecModel(m.model)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    currentSpecItem.model === m.model
                      ? 'bg-brand-50 text-brand-700 border-brand-300 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {m.display_name} ({m.model})
                </button>
              ))}
            </div>
          )}

          {/* Model Specification View */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-brand-500/20">
                  <Sparkles size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-slate-900">
                      {currentSpecItem.display_name}
                    </h2>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                      {currentSpecItem.model}
                    </span>
                    <Badge variant={currentSpecItem.status === 'ACTIVE' ? 'success' : 'warning'}>
                      {currentSpecItem.status === 'ACTIVE' ? 'Hoạt động' : 'Bảo trì'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{currentSpecItem.description || 'Không có mô tả chi tiết'}</p>
                </div>
              </div>

              <div className="text-right flex items-center gap-4 sm:justify-end">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Giá niêm yết API</span>
                  <span className="text-2xl font-black text-brand-600">
                    {formatVND(currentSpecItem.base_price)}
                  </span>
                  <span className="text-xs text-slate-500"> / ảnh hoàn tất</span>
                </div>
                {isSuperAdmin && (
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Settings size={14} />}
                    onClick={() => setEditingModel(currentSpecItem)}
                    className="bg-brand-500 hover:bg-brand-600 text-white font-bold"
                  >
                    Sửa giá
                  </Button>
                )}
              </div>
            </div>

              {/* Resolutions and Qualities Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Resolution Table */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Layers size={15} className="text-brand-500" />
                    <span>Độ Phân Giải (Resolution)</span>
                  </h3>
                  <div className="rounded-xl border border-slate-200 overflow-hidden text-xs bg-white">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                        <tr>
                          <th className="py-2.5 px-3">Cỡ phân giải</th>
                          <th className="py-2.5 px-3">Kích thước pixel</th>
                          <th className="py-2.5 px-3 text-right">Đơn giá thu khách</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(currentSpecItem.resolutions || []).map((r) => (
                          <tr key={r.key} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 font-semibold text-slate-800">{r.label}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-500">{r.dimension}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                              {formatVND(r.unit_price)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Quality Table */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Sliders size={15} className="text-purple-500" />
                    <span>Chất Lượng Lấy Mẫu (Quality)</span>
                  </h3>
                  <div className="rounded-xl border border-slate-200 overflow-hidden text-xs bg-white">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                        <tr>
                          <th className="py-2.5 px-3">Mức chất lượng</th>
                          <th className="py-2.5 px-3">Đặc điểm render</th>
                          <th className="py-2.5 px-3 text-right">Đơn giá</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(currentSpecItem.qualities || []).map((q) => (
                          <tr key={q.key} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 font-semibold text-purple-700">{q.label}</td>
                            <td className="py-2.5 px-3 text-slate-500">{q.description}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                              Đồng giá {formatVND(currentSpecItem.base_price)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Smart Cache Banner */}
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 text-xs text-emerald-800">
                  <Zap size={18} className="text-emerald-600 shrink-0" />
                  <span>
                    <strong>Smart Cache Phản Hồi Tức Thì 25ms:</strong> Miễn phí <strong>0 đ</strong> khi hệ thống phục vụ ảnh trùng prompt và tham số đã sinh trước đó.
                  </span>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-600 text-white shrink-0">
                  0đ / Cache Hit
                </span>
              </div>
            </div>
        </div>
      )}

      {/* TAB 3: Mô Phỏng Dự Toán Ngân Sách */}
      {activeTab === 'simulator' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Calculator size={18} className="text-brand-500" />
              <h2 className="text-base font-extrabold text-slate-900">
                Mô Phỏng Dự Toán Ngân Sách Theo Lưu Lượng Hàng Tháng
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Đồng bộ theo đơn giá model gpt-image-2
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Controls */}
            <div className="space-y-5">
              {/* Selector 0: AI Model */}
              {pricingList.length > 1 && (
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 text-xs">Mô hình AI dự toán:</label>
                  <select
                    value={simModel}
                    onChange={(e) => setSimModel(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  >
                    {pricingList.map((m) => (
                      <option key={m.model} value={m.model}>
                        {m.display_name} ({m.model}) • {formatVND(m.base_price)}/ảnh
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Slider 1: Monthly Images */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-slate-700">Lưu lượng ảnh dự kiến / tháng:</label>
                  <span className="font-mono text-sm font-black text-brand-600">
                    {monthlyImages.toLocaleString()} ảnh
                  </span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="50000"
                  step="100"
                  value={monthlyImages}
                  onChange={(e) => setMonthlyImages(Number(e.target.value))}
                  className="w-full accent-brand-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>100 ảnh</span>
                  <span>10.000 ảnh</span>
                  <span>25.000 ảnh</span>
                  <span>50.000 ảnh</span>
                </div>
              </div>

              {/* Slider 2: Smart Cache Hit Rate */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-slate-700">Tỷ lệ tận dụng Smart Cache 0đ (%):</label>
                  <span className="font-mono text-sm font-black text-emerald-600">
                    {cacheHitRate}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="80"
                  step="5"
                  value={cacheHitRate}
                  onChange={(e) => setCacheHitRate(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <p className="text-[11px] text-slate-400">
                  Ước tính tỷ lệ các yêu cầu trùng ý tưởng hoặc biến thể prompt đã được lưu cache tức thì.
                </p>
              </div>

              {/* Selectors for Resolution & Quality */}
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Độ phân giải mô phỏng:</label>
                  <div className="flex gap-1.5">
                    {['1k', '2k', '4k'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setResolution(r)}
                        className={`flex-1 py-1 rounded-md border font-bold uppercase transition-all text-xs ${
                          resolution === r
                            ? 'bg-brand-50 border-brand-500 text-brand-700 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Chất lượng mô phỏng:</label>
                  <div className="flex gap-1.5">
                    {['low', 'medium', 'high'].map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setQuality(q)}
                        className={`flex-1 py-1 rounded-md border font-bold capitalize transition-all text-xs ${
                          quality === q
                            ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Results Display */}
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200/80 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Kết Quả Dự Toán Ngân Sách
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-200 text-slate-800">
                  {simulation?.recommended_package || 'Mức Chuyên Nghiệp'}
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Đơn giá niêm yết API:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {formatVND(simulation?.unit_price ?? gpt2Item?.base_price ?? 150)} / ảnh
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Tổng chi phí theo lượt gọi gốc:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {formatVND(simulation?.estimated_total_raw)}
                  </span>
                </div>

                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Tiết kiệm nhờ Smart Cache (0đ):</span>
                  <span className="font-mono">-{formatVND(simulation?.estimated_cache_savings)}</span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-900">Chi phí thực tế ước tính:</span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-brand-600 font-mono">
                      {formatVND(simulation?.estimated_monthly_cost)}
                    </span>
                    <span className="text-[11px] text-slate-400 block">/ tháng</span>
                  </div>
                </div>

                {/* Admin Profit Projection */}
                {isAdmin && (
                  <div className="mt-3 pt-3 border-t border-slate-200/80 bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-500 block font-semibold">
                        Lợi nhuận ròng dự kiến (Admin):
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Vốn NCC: {formatVND(simEstProviderCost)} ({simCacheMisses.toLocaleString()} ảnh tạo mới)
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-black text-emerald-600 text-base">
                        +{formatVND(simEstNetProfit)}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 block">
                        ({simEstMarginPct.toFixed(1)}% margin)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Model Pricing Modal */}
      <EditModelPricingModal
        isOpen={Boolean(editingModel)}
        item={editingModel}
        onClose={() => setEditingModel(null)}
        onSuccess={() => {
          loadPricing();
          runSimulation();
        }}
      />

      {/* Create Model Pricing Modal */}
      <CreateModelPricingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          loadPricing();
          runSimulation();
        }}
      />
    </div>
  );
};
