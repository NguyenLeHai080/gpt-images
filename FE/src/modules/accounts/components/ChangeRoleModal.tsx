import React, { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Modal } from '../../../core/components/Modal';
import { Button } from '../../../core/components/Button/Button';
import { Badge } from '../../../core/components/Badge/Badge';
import { ROLE_OPTIONS } from '../constants';
import type { UserAccountItem, UserRole } from '../types';

interface ChangeRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccountItem | null;
  onSave: (userId: string, role: UserRole) => Promise<boolean>;
}

export const ChangeRoleModal: React.FC<ChangeRoleModalProps> = ({ isOpen, onClose, user, onSave }) => {
  const [targetRole, setTargetRole] = useState<UserRole>('MEMBER');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setTargetRole(user.role);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsSubmitting(true);
    const success = await onSave(user.id, targetRole);
    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isSubmitting && onClose()}
      title="Cập Nhật Phân Cấp Vai Trò"
      description={`Thay đổi vai trò và quyền hạn quản trị cho tài khoản: ${user?.email || ''}`}
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
            leftIcon={<ShieldCheck size={15} />}
            onClick={handleSave}
          >
            Lưu thay đổi vai trò
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {ROLE_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            onClick={() => setTargetRole(opt.value)}
            className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
              targetRole === opt.value
                ? 'border-brand-500 bg-orange-50/50 ring-2 ring-brand-500/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <input
              type="radio"
              name="user-role"
              checked={targetRole === opt.value}
              onChange={() => setTargetRole(opt.value)}
              className="mt-1 text-brand-600 focus:ring-brand-500"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">{opt.label}</span>
                <Badge variant={opt.badgeVariant}>{opt.value}</Badge>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{opt.description}</p>
            </div>
          </label>
        ))}
      </div>
    </Modal>
  );
};
