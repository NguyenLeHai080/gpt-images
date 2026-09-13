import React from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../../core/components/Button/Button';
import { Input } from '../../../core/components/Input/Input';
import { useAuthForm } from '../hooks/useAuthForm';
import '../pages/login.css';

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const {
    formData,
    showPassword,
    setShowPassword,
    error,
    isLoading,
    handleChange,
    handleSubmit,
  } = useAuthForm(onSuccess);

  return (
    <div className="mf-login-form-container">
      {/* Title & Subtitle */}
      <div className="mf-form-header">
        <h2 className="mf-form-title">Chào mừng trở lại</h2>
        <p className="mf-form-subtitle">Đăng nhập để tiếp tục vào không gian làm việc.</p>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="mf-form">
        {error && (
          <div className="mf-form-alert mf-form-alert--error animate-fade-in">
            {error}
          </div>
        )}

        {/* Email Input */}
        <Input
          label="Email"
          type="email"
          placeholder="admin@mintforge.vn"
          value={formData.email}
          onChange={e => handleChange('email', e.target.value)}
          leftIcon={<Mail size={17} />}
          required
        />

        {/* Checkbox: Link API Key */}
        <div className="mf-checkbox-wrapper">
          <input
            type="checkbox"
            id="link-api-key"
            checked={formData.linkApiKey}
            onChange={e => handleChange('linkApiKey', e.target.checked)}
            className="mf-checkbox"
          />
          <label htmlFor="link-api-key" className="mf-checkbox-label">
            Tôi đã có API key và muốn liên kết với tài khoản này
          </label>
        </div>

        {/* Password Input */}
        <Input
          label="Mật khẩu"
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          value={formData.password}
          onChange={e => handleChange('password', e.target.value)}
          leftIcon={<Lock size={17} />}
          rightIcon={showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          onRightIconClick={() => setShowPassword(!showPassword)}
          required
        />

        {/* Remember me & Forgot Password */}
        <div className="mf-form-row">
          <div className="mf-checkbox-wrapper">
            <input
              type="checkbox"
              id="remember-me"
              checked={formData.rememberMe}
              onChange={e => handleChange('rememberMe', e.target.checked)}
              className="mf-checkbox"
            />
            <label htmlFor="remember-me" className="mf-checkbox-label">
              Ghi nhớ đăng nhập
            </label>
          </div>
          <a href="#forgot" className="mf-forgot-link">
            Quên mật khẩu?
          </a>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isLoading}
          className="mf-btn-login-submit"
        >
          Đăng nhập
        </Button>

        {/* Registration Link */}
        <div className="mf-register-prompt">
          <span>Chưa có tài khoản hoặc chưa có key? </span>
          <a href="#register" className="mf-register-link">
            Đăng ký tài khoản mới
          </a>
        </div>

        {/* Social / SSO Divider */}
        <div className="mf-divider">
          <span className="mf-divider-line" />
          <span className="mf-divider-text">hoặc tiếp tục với</span>
          <span className="mf-divider-line" />
        </div>

        {/* Legal Terms Footer */}
        <p className="mf-terms-text">
          Bằng việc đăng nhập, bạn đồng ý với Điều khoản và Chính sách bảo mật.
        </p>
      </form>
    </div>
  );
};
