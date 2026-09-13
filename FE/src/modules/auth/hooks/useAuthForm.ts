import { useState } from 'react';
import { useAuth } from '../../../core/hooks/useAuth';
import type { LoginCredentials } from '../types';

export const useAuthForm = (onSuccess?: () => void) => {
  const { login, isLoading } = useAuth();
  const [formData, setFormData] = useState<LoginCredentials>({
    email: 'admin@mintforge.vn',
    password: '••••••••',
    linkApiKey: false,
    rememberMe: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof LoginCredentials, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim()) {
      setError('Vui lòng nhập địa chỉ email');
      return;
    }

    try {
      const ok = await login(formData.email, formData.password, formData.linkApiKey);
      if (ok) {
        if (onSuccess) onSuccess();
      } else {
        setError('Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.');
      }
    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra khi kết nối máy chủ');
    }
  };

  return {
    formData,
    showPassword,
    setShowPassword,
    error,
    isLoading,
    handleChange,
    handleSubmit,
  };
};
