import React from 'react';
import { AuthBrandingPanel } from '../components/AuthBrandingPanel';
import { LoginForm } from '../components/LoginForm';
import './login.css';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  return (
    <div className="mf-login-page">
      {/* Left Split: Dark Branding Hero */}
      <AuthBrandingPanel />

      {/* Right Split: Clean White Auth Form */}
      <div className="mf-login-form-side">
        <LoginForm onSuccess={onLoginSuccess} />
      </div>
    </div>
  );
};
