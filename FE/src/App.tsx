import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './core/hooks/useAuth';
import { ProtectedRoute } from './core/routes/ProtectedRoute';
import { MainLayout } from './core/layout/MainLayout';
import { LoginPage } from './modules/auth/pages/LoginPage';
import { DashboardPage } from './modules/dashboard/pages/DashboardPage';
import { ApiKeysPage } from './modules/api-keys/pages/ApiKeysPage';
import { ApiDocsPage } from './modules/api-keys/pages/ApiDocsPage';
import { BillingPage } from './modules/billing/pages/BillingPage';
import { BankingConfigPage } from './modules/billing/pages/BankingConfigPage';
import { CreditConfigPage } from './modules/billing/pages/CreditConfigPage';
import { SepayTransactionsPage } from './modules/billing/pages/SepayTransactionsPage';
import { PackagesPage } from './modules/packages/pages/PackagesPage';
import { PricingPage } from './modules/pricing/pages/PricingPage';
import { ToolsPage } from './modules/tools/pages/ToolsPage';
import { AccountsPage } from './modules/accounts/pages/AccountsPage';
import { PermissionsPage } from './modules/permissions/pages/PermissionsPage';
import { JobsLogPage } from './modules/generations/pages/JobsLogPage';
import { StudioPage } from './modules/generations/pages/StudioPage';
import { PnLManagementPage } from './modules/generations/pages/PnLManagementPage';
import { ErrorBoundary, ErrorPage, ErrorState } from './core/components/ErrorState';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/login" element={<Navigate to="/auth/login" replace />} />
            <Route path="/api-docs" element={<Navigate to="/app/api-docs" replace />} />

            {/* Standard Protected App Routes with /app Prefix */}
            <Route
              path="/app/*"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Routes>
                      <Route path="overview" element={<DashboardPage />} />
                      <Route path="dashboard" element={<Navigate to="/app/overview" replace />} />
                      <Route path="jobs" element={<JobsLogPage />} />
                      <Route path="studio" element={<StudioPage />} />
                      <Route
                        path="pnl"
                        element={
                          <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
                            <PnLManagementPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="api-keys"
                        element={
                          <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'ADMIN', 'DEVELOPER']}>
                            <ApiKeysPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="api-docs" element={<ApiDocsPage />} />
                      <Route path="billing" element={<BillingPage />} />
                      <Route path="wallet" element={<BillingPage />} />
                      <Route
                        path="banking"
                        element={
                          <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
                            <BankingConfigPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="credit-config"
                        element={
                          <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
                            <CreditConfigPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="sepay" element={<SepayTransactionsPage />} />
                      <Route
                        path="accounts"
                        element={
                          <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
                            <AccountsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="permissions"
                        element={
                          <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
                            <PermissionsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="packages" element={<PackagesPage />} />
                      <Route path="pricing" element={<PricingPage />} />
                      <Route path="tools" element={<ToolsPage />} />
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
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;