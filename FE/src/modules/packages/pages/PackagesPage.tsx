import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Check, RefreshCw, Edit2, Trash2, Zap } from 'lucide-react';
import { Button } from '../../../core/components/Button/Button';
import { Badge } from '../../../core/components/Badge/Badge';
import { Modal } from '../../../core/components/Modal/Modal';
import { Input } from '../../../core/components/Input/Input';
import { alert } from '../../../core/alert';
import { useAuth } from '../../../core/hooks/useAuth';
import { packagesApi } from '../api';
import type { PackageItem, CreatePackageData } from '../types';

export const PackagesPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<PackageItem | null>(null);
  const [formData, setFormData] = useState<CreatePackageData>({
    name: '',
    price: 100000,
    credits: 700,
    bonus_credits: 50,
    discount_pct: 0,
    badge: '',
    description: '',
    is_popular: false,
    is_active: true,
    features: [''],
  });

  const loadPackages = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await packagesApi.getPackages();
      if (res.success && res.data) {
        setPackages(res.data);
      }
    } catch (err: any) {
      console.warn('Lỗi tải danh sách gói:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  const handleOpenCreate = () => {
    setEditingPkg(null);
    setFormData({
      name: '',
      price: 200000,
      credits: 1500,
      bonus_credits: 100,
      discount_pct: 10,
      badge: 'MỚI',
      description: 'Gói ưu đãi đặc biệt cho thành viên mới',
      is_popular: false,
      is_active: true,
      features: ['Tạo ảnh 1K/2K/4K sắc nét', 'Hỗ trợ Smart Cache 25ms', 'Không giới hạn API keys'],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (pkg: PackageItem) => {
    setEditingPkg(pkg);
    setFormData({
      name: pkg.name,
      price: pkg.price,
      credits: pkg.credits,
      bonus_credits: pkg.bonus_credits,
      discount_pct: pkg.discount_pct,
      badge: pkg.badge || '',
      description: pkg.description,
      is_popular: pkg.is_popular,
      is_active: pkg.is_active,
      features: pkg.features.length > 0 ? pkg.features : [''],
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (pkg: PackageItem) => {
    const ok = await alert.confirm({
      title: 'Xóa Gói Dịch Vụ',
      text: `Xác nhận xóa gói "${pkg.name}" khỏi hệ thống?`,
      confirmButtonText: 'Xác nhận xóa',
      isDanger: true,
    });
    if (ok) {
      try {
        await packagesApi.deletePackage(pkg.id);
        loadPackages();
      } catch (err: any) {
        alert.error('Lỗi khi xóa gói', err?.message);
      }
    }
  };

  const handleFeatureChange = (index: number, val: string) => {
    const updated = [...formData.features];
    updated[index] = val;
    setFormData((prev) => ({ ...prev, features: updated }));
  };

  const handleAddFeature = () => {
    setFormData((prev) => ({ ...prev, features: [...prev.features, ''] }));
  };

  const handleRemoveFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanFeatures = formData.features.map((f) => f.trim()).filter(Boolean);
    const payload: CreatePackageData = {
      ...formData,
      features: cleanFeatures.length > 0 ? cleanFeatures : ['Tạo ảnh AI chuẩn cao cấp'],
    };

    try {
      if (editingPkg) {
        await packagesApi.updatePackage(editingPkg.id, payload);
      } else {
        await packagesApi.createPackage(payload);
      }
      setIsModalOpen(false);
      loadPackages();
    } catch (err: any) {
      alert.error('Thao tác thất bại', err?.message);
    }
  };

  const formatVND = (amount: number) => new Intl.NumberFormat('vi-VN').format(amount) + ' đ';

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Cấu Hình Gói Dịch Vụ & Credit</h1>
            <span className="text-xs bg-brand-50 text-brand-600 px-2.5 py-0.5 rounded-full font-bold border border-brand-200">
              Credit Bundles
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý các mức nạp tiền trả trước, tỷ lệ chiết khấu khuyến mại và đặc quyền tài nguyên dành cho khách hàng.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            leftIcon={<RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />}
            onClick={loadPackages}
          >
            Làm mới
          </Button>
          {isAdmin && (
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus size={15} />}
              onClick={handleOpenCreate}
              className="bg-brand-500 hover:bg-brand-600 text-white font-bold shadow-md shadow-brand-500/20"
            >
              + Tạo Gói Mới
            </Button>
          )}
        </div>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className={`relative rounded-2xl border bg-white p-5 flex flex-col justify-between hover-lift transition-all duration-200 shadow-xs ${
              pkg.is_popular
                ? 'border-brand-500 ring-2 ring-brand-500/20 shadow-md'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            {/* Top Badges */}
            <div className="flex items-center justify-between gap-2 mb-3">
              {pkg.badge ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500 text-white shadow-2xs">
                  {pkg.badge}
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  TIÊU CHUẨN
                </span>
              )}
              {pkg.is_active ? (
                <Badge variant="success">Hoạt động</Badge>
              ) : (
                <Badge variant="dark">Tạm dừng</Badge>
              )}
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">{pkg.name}</h3>
              <p className="text-xs text-slate-500 mt-1 min-h-[36px] line-clamp-2">{pkg.description}</p>

              {/* Price & Credits */}
              <div className="my-4 pt-3 border-t border-slate-100">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900">{formatVND(pkg.price)}</span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-brand-600 font-bold">
                  <Zap size={14} />
                  <span>
                    {(pkg.credits + pkg.bonus_credits).toLocaleString()} Credits
                    {pkg.bonus_credits > 0 && (
                      <span className="text-emerald-600 font-normal ml-1">
                        (+{pkg.bonus_credits} thưởng)
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Feature Checklist */}
              <ul className="space-y-2 text-xs text-slate-600 mb-6">
                {pkg.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check size={14} className="text-brand-500 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions for Admin */}
            {isAdmin && (
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEdit(pkg)}
                  leftIcon={<Edit2 size={13} />}
                  className="flex-1 text-xs"
                >
                  Sửa gói
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(pkg)}
                  title="Xóa gói này"
                  className="text-slate-400 hover:text-rose-600 px-2"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal Add / Edit Package */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="md"
        title={editingPkg ? 'Chỉnh Sửa Gói Dịch Vụ' : 'Tạo Gói Dịch Vụ Mới'}
        description="Cấu hình mức giá, số lượt tạo ảnh và các đặc quyền đi kèm"
      >
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <Input
            label="Tên Gói Dịch Vụ"
            placeholder="Ví dụ: Gói Siêu Cấp Pro Studio"
            value={formData.name}
            onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Giá Bán (VNĐ)"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData((p) => ({ ...p, price: Number(e.target.value) }))}
              required
            />
            <Input
              label="Số Credits Cơ Bản"
              type="number"
              value={formData.credits}
              onChange={(e) => setFormData((p) => ({ ...p, credits: Number(e.target.value) }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Credit Tặng Kèm (Bonus)"
              type="number"
              value={formData.bonus_credits}
              onChange={(e) => setFormData((p) => ({ ...p, bonus_credits: Number(e.target.value) }))}
            />
            <Input
              label="Huy Hiệu (Badge Tag)"
              placeholder="VD: PHỔ BIẾN, TIẾT KIỆM 20%"
              value={formData.badge || ''}
              onChange={(e) => setFormData((p) => ({ ...p, badge: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Mô Tả Ngắn</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 outline-none focus:border-brand-500"
              placeholder="Mô tả đối tượng phù hợp và ưu điểm chính..."
              required
            />
          </div>

          {/* Features List */}
          <div className="space-y-1.5 pt-1">
            <label className="font-bold text-slate-700 flex items-center justify-between">
              <span>Đặc Quyền / Tính Năng Nổi Bật</span>
              <button
                type="button"
                onClick={handleAddFeature}
                className="text-[11px] text-brand-600 font-semibold hover:underline"
              >
                + Thêm dòng
              </button>
            </label>
            {formData.features.map((feat, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={feat}
                  onChange={(e) => handleFeatureChange(idx, e.target.value)}
                  placeholder={`Đặc quyền #${idx + 1}...`}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-md p-1.5 text-xs text-slate-800 outline-none focus:border-brand-500"
                />
                {formData.features.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(idx)}
                    className="text-slate-400 hover:text-rose-500 p-1"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={formData.is_popular}
                onChange={(e) => setFormData((p) => ({ ...p, is_popular: e.target.checked }))}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
              />
              <span>Đánh dấu là gói Phổ biến nhất (Highlight)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData((p) => ({ ...p, is_active: e.target.checked }))}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
              />
              <span>Kích hoạt mở bán</span>
            </label>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {editingPkg ? 'Lưu thay đổi' : 'Tạo gói mới'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
