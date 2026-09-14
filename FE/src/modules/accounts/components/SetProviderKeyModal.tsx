import React, { useState, useEffect } from 'react';
import { KeyRound, ShieldCheck, Sparkles } from 'lucide-react';
import { Modal } from '../../../core/components/Modal';
import { Button } from '../../../core/components/Button/Button';
import { Input } from '../../../core/components/Input/Input';
import type { UserAccountItem } from '../types';

interface SetProviderKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccountItem | null;
  onSave: (userId: string, providerKey: string) => Promise<boolean>;
}

export const SetProviderKeyModal: React.FC<SetProviderKeyModalProps> = ({
  isOpen,
  onClose,
  user,
  onSave,
}) => {
  const [providerKey, setProviderKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setProviderKey('');
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    try {
      const success = await onSave(user.id, providerKey.trim());
      if (success) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isSubmitting && onClose()}
      title="Gán API Key Nhà Cung Cấp (Upstream)"
      description={`Cấu hình Provider Key phân luồng cho tài khoản: ${user.full_name} (${user.email})`}
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
            onClick={() => handleSubmit()}
          >
            Lưu Cấu Hình
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Cơ chế phân quyền & hạch toán chi phí */}
        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs text-blue-900 space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-blue-800">
            <Sparkles size={14} className="text-blue-600 shrink-0" />
            <span>Cơ chế phân quyền & hạch toán chi phí:</span>
          </div>
          <ul className="list-disc pl-4 space-y-1 text-blue-800/90 text-[11px] leading-relaxed">
            <li>API Key được lấy từ tài khoản nhà cung cấp (giá <strong>120đ/ảnh</strong>).</li>
            <li>Khi khách đăng nhập vào tài khoản này và gọi tạo ảnh: Hệ thống trừ <strong>150đ/ảnh</strong> vào ví khách.</li>
            <li>Super Admin giữ lại <strong>30đ/ảnh lợi nhuận</strong>.</li>
            <li>Thông tin URL và API Key của nhà cung cấp được <strong>bảo mật 100%</strong>, khách chỉ nhìn thấy API Key nội bộ.</li>
          </ul>
        </div>

        <div>
          <Input
            label="API Key Nhà Cung Cấp (Provider Key)"
            type="text"
            value={providerKey}
            onChange={(e) => setProviderKey(e.target.value)}
            placeholder={user.has_provider_key ? `Đã gán (${user.provider_key_masked}) - Nhập mới để đổi` : "sk-..."}
            leftIcon={<KeyRound size={14} className="text-slate-400" />}
          />
          <p className="text-[11px] text-slate-400 mt-1.5">
            {user.has_provider_key
              ? "Để trống nếu muốn giữ nguyên key hiện tại, hoặc nhập key mới để cập nhật."
              : "Nhập Provider Key từ nhà cung cấp để gán riêng cho tài khoản này."}
          </p>
        </div>
      </form>
    </Modal>
  );
};
