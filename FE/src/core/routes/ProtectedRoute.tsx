import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ErrorState } from '../components/ErrorState';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: ('SUPER_ADMIN' | 'ADMIN' | 'DEVELOPER' | 'MEMBER')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (requiredRoles && user && !requiredRoles.includes(user.role)) {
    return (
      <div className="p-6">
        <ErrorState
          code="403"
          title="Từ chối truy cập (403 Forbidden)"
          description="Tài khoản của bạn không được cấp quyền hạn để truy cập vào phân hệ này."
        />
      </div>
    );
  }

  return <>{children}</>;
};