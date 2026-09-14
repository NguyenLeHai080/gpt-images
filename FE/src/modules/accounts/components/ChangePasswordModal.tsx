import React, { useState } from 'react';
import { KeyRound, Lock, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { Modal } from '../../../core/components/Modal';
import { Button } from '../../../core/components/Button/Button';
import { Input } from '../../../core/components/Input/Input';
import type { UserAccountItem } from '../types';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccountItem | null;
  onSave: (userId: string, newPassword: string) => Promise<boolean>;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  user,
  onSave,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!newPassword || newPassword.length < 6) {
      errs.newPassword = 'Mật khẩu mới phải từ 6 ký tự trở lên';
    }
    if (newPassword !== confirmPassword) {
      errs.confirmPassword = 'Mật khẩu xác nhận không trùng khớp';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!validate()) return;

    setIsSubmitting(true);
    const success = await onSave(user.id, newPassword);
    setIsSubmitting(false);

    if (success) {
      setNewPassword('');
      setConfirmPassword('');
      setErrors({});
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isSubmitting && onClose()}
      title="Đặt Lại Mật Khẩu Người Dùng"
      description={`Cập nhật mật khẩu đăng nhập trực tiếp cho: ${user?.full_name} (${user?.email})`}
      size="md"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Hủy bỏ
          </Button>
          <Button
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            leftIcon={<KeyRound size={15} />}
            onClick={handleSubmit}
          >
            Lưu mật khẩu mới
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-center gap-2.5">
          <ShieldAlert size={18} className="text-amber-600 shrink-0" />
          <span>
            Sau khi đổi mật khẩu thành công, người dùng sẽ cần sử dụng mật khẩu mới này để đăng nhập vào hệ thống.
          </span>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <Input
              label="Mật khẩu mới *"
              type={showPassword ? 'text' : 'password'}
              placeholder="Tối thiểu 6 ký tự"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              error={errors.newPassword}
              leftIcon={<Lock size={14} className="text-slate-400" />}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-8 text-slate-400 hover:text-slate-600 p-1"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          <Input
            label="Xác nhận mật khẩu mới *"
            type={showPassword ? 'text' : 'password'}
            placeholder="Nhập lại mật khẩu mới"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
            leftIcon={<Lock size={14} className="text-slate-400" />}
          />
        </div>
      </form>
    </Modal>
  );
};
