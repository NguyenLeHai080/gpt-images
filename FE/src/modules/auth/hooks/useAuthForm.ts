import { useState } from 'react';
import { useAuth } from '../../../core/hooks/useAuth';
import { alert } from '../../../core/alert';
import type { LoginCredentials } from '../types';

export const useAuthForm = (onSuccess?: () => void) => {
  const { login, isLoading } = useAuth();
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: '',
    linkApiKey: false,
    rememberMe: false,
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
      alert.warning('Thông tin chưa đầy đủ', 'Vui lòng nhập địa chỉ email để tiếp tục.');
      return;
    }
    if (!formData.password) {
      setError('Vui lòng nhập mật khẩu');
      alert.warning('Thông tin chưa đầy đủ', 'Vui lòng nhập mật khẩu tài khoản.');
      return;
    }

    try {
      const ok = await login(formData.email, formData.password, formData.linkApiKey);
      if (ok) {
        alert.toast('Đăng nhập thành công! Chào mừng trở lại.', 'success');
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      const errMsg = err.message || 'Email hoặc mật khẩu không chính xác';
      setError(errMsg);
      alert.error('Đăng nhập thất bại', errMsg);
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