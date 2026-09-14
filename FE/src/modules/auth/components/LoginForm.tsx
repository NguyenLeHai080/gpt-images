import React from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../../core/components/Button/Button';
import { Input } from '../../../core/components/Input/Input';
import { useAuthForm } from '../hooks/useAuthForm';
import { alert } from '../../../core/alert';

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
          placeholder="Nhập địa chỉ email"
          value={formData.email}
          onChange={e => handleChange('email', e.target.value)}
          leftIcon={<Mail size={17} />}
          required
        />

        {/* Password Input */}
        <Input
          label="Mật khẩu"
          type={showPassword ? 'text' : 'password'}
          placeholder="Nhập mật khẩu"
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
          <button
            type="button"
            onClick={() => alert.info('Khôi phục mật khẩu', 'Vui lòng liên hệ quản trị viên hệ thống để cấp lại mật khẩu truy cập.')}
            className="mf-forgot-link"
          >
            Quên mật khẩu?
          </button>
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
          <button
            type="button"
            onClick={() => alert.info('Đăng ký tài khoản', 'Cổng đăng ký doanh nghiệp đang mở theo diện mời nội bộ. Vui lòng liên hệ support@mintforge.vn.')}
            className="mf-register-link inline font-semibold"
          >
            Đăng ký tài khoản mới
          </button>
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
