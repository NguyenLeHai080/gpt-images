import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../core/hooks/useAuth';
import { AuthBrandingPanel } from '../components/AuthBrandingPanel';
import { LoginForm } from '../components/LoginForm';
import './login.css';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/app/overview', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSuccess = () => {
    if (onLoginSuccess) onLoginSuccess();
    navigate('/app/overview', { replace: true });
  };

  return (
    <div className="mf-login-page">
      {/* Left Split: Dark Branding Hero */}
      <AuthBrandingPanel />

      {/* Right Split: Clean White Auth Form */}
      <div className="mf-login-form-side">
        <LoginForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
};