import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './core/hooks/useAuth';
import { ProtectedRoute } from './core/routes/ProtectedRoute';
import { MainLayout } from './core/layout/MainLayout';
import { LoginPage } from './modules/auth/pages/LoginPage';
import { DashboardPage } from './modules/dashboard/pages/DashboardPage';
import { ApiKeysPage } from './modules/api-keys/pages/ApiKeysPage';
import { BillingPage } from './modules/billing/pages/BillingPage';
import { AccountsPage } from './modules/accounts/pages/AccountsPage';
import { PermissionsPage } from './modules/permissions/pages/PermissionsPage';
import { ErrorBoundary, ErrorPage, ErrorState } from './core/components/ErrorState';
import { DemoSwitcher } from './core/components/DemoSwitcher';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/login" element={<Navigate to="/auth/login" replace />} />

            {/* Standard Protected App Routes with /app Prefix */}
            <Route
              path="/app/*"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Routes>
                      <Route path="overview" element={<DashboardPage />} />
                      <Route path="dashboard" element={<Navigate to="/app/overview" replace />} />
                      <Route path="api-keys" element={<ApiKeysPage />} />
                      <Route path="billing" element={<BillingPage />} />
                      <Route path="wallet" element={<BillingPage />} />
                      <Route path="banking" element={<BillingPage />} />
                      <Route path="credit-config" element={<BillingPage />} />
                      <Route path="sepay" element={<BillingPage />} />
                      <Route path="accounts" element={<AccountsPage />} />
                      <Route path="permissions" element={<PermissionsPage />} />
                      <Route path="packages" element={<DashboardPage />} />
                      <Route path="pricing" element={<DashboardPage />} />
                      <Route path="tools" element={<DashboardPage />} />
                      <Route path="" element={<Navigate to="overview" replace />} />
                      <Route
                        path="*"
                        element={
                          <ErrorState
                            code="404"
                            title="Không tìm thấy mục trong Workspace"
                            description="Phân hệ hoặc trang quản trị bạn yêu cầu không tồn tại trong không gian làm việc."
                          />
                        }
                      />
                    </Routes>
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            {/* Direct Standard Error Pages */}
            <Route path="/404" element={<ErrorPage code="404" />} />
            <Route path="/403" element={<ErrorPage code="403" />} />
            <Route path="/500" element={<ErrorPage code="500" />} />
            <Route path="/503" element={<ErrorPage code="503" />} />
            <Route path="/network-error" element={<ErrorPage code="network" />} />

            {/* Root Redirect to /app/overview */}
            <Route path="/" element={<Navigate to="/app/overview" replace />} />
            {/* Global Catch-all: 404 Not Found Page */}
            <Route path="*" element={<ErrorPage code="404" />} />
          </Routes>

          <DemoSwitcher />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;