import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
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
import { ProvidersPage } from './modules/providers/pages/ProvidersPage';
import { ToolsPage } from './modules/tools/pages/ToolsPage';
import { AccountsPage } from './modules/accounts/pages/AccountsPage';
import { PermissionsPage } from './modules/permissions/pages/PermissionsPage';
import { JobsLogPage } from './modules/generations/pages/JobsLogPage';
import { StudioPage } from './modules/generations/pages/StudioPage';
import { PnLManagementPage } from './modules/generations/pages/PnLManagementPage';
import { ErrorBoundary, ErrorPage, ErrorState } from './core/components/ErrorState';

const PublicApiDocsWrapper: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-500 to-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            MF
          </div>
          <div>
            <span className="font-black text-sm text-slate-900 tracking-tight">MintForge Business Suite</span>
            <span className="text-[10px] text-slate-400 block -mt-0.5">Developer API Documentation</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Link to="/auth/login">
            <button className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors">
              Đăng nhập
            </button>
          </Link>
          <Link to="/app/studio">
            <button className="px-3.5 py-1.5 rounded-xl bg-brand-500 text-white text-xs font-bold hover:bg-brand-600 transition-colors shadow-xs">
              Mở Studio
            </button>
          </Link>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <ApiDocsPage />
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/login" element={<Navigate to="/auth/login" replace />} />
            <Route path="/api-docs" element={<PublicApiDocsWrapper />} />

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
                      <Route path="api-keys" element={<ApiKeysPage />} />
                      <Route path="api-docs" element={<ApiDocsPage />} />
                      <Route path="billing" element={<BillingPage />} />
                      <Route path="wallet" element={<BillingPage />} />
                      <Route path="banking" element={<BankingConfigPage />} />

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
                      <Route
                        path="providers"
                        element={
                          <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
                            <ProvidersPage />
                          </ProtectedRoute>
                        }
                      />
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