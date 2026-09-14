import React, { useState, useEffect } from 'react';
import { Mail, Building2, User, Shield, CheckCircle2 } from 'lucide-react';
import { Modal } from '../../../core/components/Modal';
import { Button } from '../../../core/components/Button/Button';
import { Input } from '../../../core/components/Input/Input';
import { Badge } from '../../../core/components/Badge/Badge';
import { ROLE_OPTIONS } from '../constants';
import type { UserAccountItem, UpdateUserData } from '../types';

interface EditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccountItem | null;
  isSuperAdmin: boolean;
  onSave: (userId: string, data: UpdateUserData) => Promise<boolean>;
}

export const EditAccountModal: React.FC<EditAccountModalProps> = ({
  isOpen,
  onClose,
  user,
  isSuperAdmin,
  onSave,
}) => {
  const [formData, setFormData] = useState<UpdateUserData>({
    full_name: '',
    email: '',
    company_name: '',
    role: 'MEMBER',
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name,
        email: user.email,
        company_name: user.company_name,
        role: user.role,
        is_active: user.is_active,
      });
      setFormErrors({});
    }
  }, [user]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.full_name?.trim()) errors.full_name = 'Vui lòng nhập họ và tên';
    if (!formData.email?.trim()) {
      errors.email = 'Vui lòng nhập địa chỉ email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Email không hợp lệ';
    }
    if (!formData.company_name?.trim()) errors.company_name = 'Vui lòng nhập tên công ty / phòng ban';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!validateForm()) return;

    setIsSubmitting(true);
    const success = await onSave(user.id, formData);
    setIsSubmitting(false);

    if (success) {
      onClose();
    }
  };

  const isRootAdmin = user?.email === 'admin@mintforge.vn';

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isSubmitting && onClose()}
      title="Chỉnh Sửa Thông Tin Tài Khoản"
      description={`Cập nhật thông tin chi tiết cho tài khoản: ${user?.email || ''}`}
      size="lg"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Hủy bỏ
          </Button>
          <Button
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            leftIcon={<CheckCircle2 size={15} />}
            onClick={handleSubmit}
          >
            Lưu thay đổi
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {isRootAdmin && (
          <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-800 flex items-center gap-2">
            <Shield size={16} className="text-purple-600 shrink-0" />
            <span>
              <strong>Tài khoản Super Admin gốc:</strong> Vai trò và trạng thái hoạt động được hệ thống bảo vệ cố định.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Họ và tên *"
            placeholder="VD: Nguyễn Văn An"
            value={formData.full_name || ''}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            error={formErrors.full_name}
            leftIcon={<User size={14} className="text-slate-400" />}
          />

          <Input
            label="Địa chỉ Email *"
            type="email"
            placeholder="VD: user@mintforge.vn"
            value={formData.email || ''}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={formErrors.email}
            disabled={isRootAdmin}
            leftIcon={<Mail size={14} className="text-slate-400" />}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Công ty / Phòng ban *"
            placeholder="VD: MintForge AI Lab"
            value={formData.company_name || ''}
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            error={formErrors.company_name}
            leftIcon={<Building2 size={14} className="text-slate-400" />}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Trạng thái tài khoản</label>
            <div className="flex items-center gap-3 mt-1.5">
              <button
                type="button"
                disabled={isRootAdmin}
                onClick={() => setFormData({ ...formData, is_active: true })}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  formData.is_active
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-300" />
                <span>Hoạt động</span>
              </button>

              <button
                type="button"
                disabled={isRootAdmin}
                onClick={() => setFormData({ ...formData, is_active: false })}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  !formData.is_active
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-300" />
                <span>Tạm khóa</span>
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">Phân Cấp Vai Trò (Role) *</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {ROLE_OPTIONS.map((opt) => {
              // Only superadmin can assign Super Admin role
              const canSelectThisRole = isSuperAdmin || opt.value !== 'SUPER_ADMIN';
              const isDisabled = isRootAdmin || !canSelectThisRole;

              return (
                <div
                  key={opt.value}
                  onClick={() => !isDisabled && setFormData({ ...formData, role: opt.value })}
                  className={`p-3 rounded-xl border transition-all ${
                    isDisabled ? 'opacity-40 cursor-not-allowed bg-slate-50' : 'cursor-pointer'
                  } ${
                    formData.role === opt.value
                      ? 'border-brand-500 bg-orange-50/50 ring-2 ring-brand-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-800">{opt.label}</span>
                    <Badge variant={opt.badgeVariant} size="sm">
                      {opt.value}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{opt.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </form>
    </Modal>
  );
};
