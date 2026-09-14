import React, { useState } from 'react';
import { Mail, Lock, Building2, UserCheck } from 'lucide-react';
import { Modal } from '../../../core/components/Modal';
import { Button } from '../../../core/components/Button/Button';
import { Input } from '../../../core/components/Input/Input';
import { Badge } from '../../../core/components/Badge/Badge';
import { ROLE_OPTIONS } from '../constants';
import type { CreateUserData } from '../types';

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserData) => Promise<boolean>;
}

export const CreateAccountModal: React.FC<CreateAccountModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<CreateUserData>({
    full_name: '',
    email: '',
    password: '',
    role: 'MEMBER',
    company_name: 'MintForge Business Suite',
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.full_name.trim()) errors.full_name = 'Vui lòng nhập họ và tên';
    if (!formData.email.trim()) {
      errors.email = 'Vui lòng nhập địa chỉ email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Email không hợp lệ';
    }
    if (!formData.password || formData.password.length < 6) {
      errors.password = 'Mật khẩu phải từ 6 ký tự trở lên';
    }
    if (!formData.company_name.trim()) errors.company_name = 'Vui lòng nhập tên công ty / phòng ban';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    const success = await onSubmit(formData);
    setIsSubmitting(false);

    if (success) {
      onClose();
      setFormData({
        full_name: '',
        email: '',
        password: '',
        role: 'MEMBER',
        company_name: 'MintForge Business Suite',
        is_active: true,
      });
      setFormErrors({});
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isSubmitting && onClose()}
      title="Thêm Tài Khoản Nhân Sự Mới"
      description="Khởi tạo tài khoản, phân vai trò và cấp quyền truy cập vào MintForge Business Suite."
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
            leftIcon={<UserCheck size={15} />}
            onClick={handleSubmit}
          >
            Tạo tài khoản
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Họ và tên *"
            placeholder="VD: Nguyễn Văn An"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            error={formErrors.full_name}
          />

          <Input
            label="Địa chỉ Email *"
            type="email"
            placeholder="VD: user@mintforge.vn"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={formErrors.email}
            leftIcon={<Mail size={14} className="text-slate-400" />}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Mật khẩu khởi tạo *"
            type="password"
            placeholder="Tối thiểu 6 ký tự"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={formErrors.password}
            leftIcon={<Lock size={14} className="text-slate-400" />}
          />

          <Input
            label="Công ty / Phòng ban *"
            placeholder="VD: MintForge AI Lab"
            value={formData.company_name}
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            error={formErrors.company_name}
            leftIcon={<Building2 size={14} className="text-slate-400" />}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">Phân Cấp Vai Trò (Role) *</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {ROLE_OPTIONS.map((opt) => (
              <div
                key={opt.value}
                onClick={() => setFormData({ ...formData, role: opt.value })}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
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
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
};
