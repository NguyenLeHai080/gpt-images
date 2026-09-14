import React, { useState, useEffect } from 'react';
import { X, KeyRound, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '../../../core/components/Button/Button';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <KeyRound size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Gán API Key Nhà Cung Cấp (Upstream)</h3>
              <p className="text-xs text-slate-500">Tài khoản: <strong>{user.full_name}</strong> ({user.email})</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/70 text-xs text-blue-900 space-y-2">
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
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              API Key Nhà Cung Cấp (Provider Key)
            </label>
            <div className="relative">
              <input
                type="text"
                value={providerKey}
                onChange={(e) => setProviderKey(e.target.value)}
                placeholder={user.has_provider_key ? `Đã gán (${user.provider_key_masked}) - Nhập mới để đổi` : "sk-..."}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {user.has_provider_key ? "Để trống nếu muốn giữ nguyên key hiện tại, hoặc nhập key mới để cập nhật." : "Nhập Provider Key từ nhà cung cấp để gán riêng cho tài khoản này."}
            </p>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              leftIcon={<ShieldCheck size={14} />}
            >
              Lưu Cấu Hình
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
