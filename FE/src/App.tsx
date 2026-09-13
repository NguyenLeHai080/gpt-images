import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './core/hooks/useAuth';
import { ProtectedRoute } from './core/routes/ProtectedRoute';
import { MainLayout } from './core/layout/MainLayout';
import { LoginPage } from './modules/auth/pages/LoginPage';
import { DashboardPage } from './modules/dashboard/pages/DashboardPage';
import { ApiKeysPage } from './modules/api-keys/pages/ApiKeysPage';
import { BillingPage } from './modules/billing/pages/BillingPage';
import { DemoSwitcher } from './core/components/DemoSwitcher';

export const App: React.FC = () => {
  return (
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
                    <Route path="accounts" element={<DashboardPage />} />
                    <Route path="permissions" element={<DashboardPage />} />
                    <Route path="packages" element={<DashboardPage />} />
                    <Route path="pricing" element={<DashboardPage />} />
                    <Route path="tools" element={<DashboardPage />} />
                    <Route path="" element={<Navigate to="overview" replace />} />
                    <Route path="*" element={<Navigate to="overview" replace />} />
                  </Routes>
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Root Redirect to /app/overview */}
          <Route path="/" element={<Navigate to="/app/overview" replace />} />
          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/app/overview" replace />} />
        </Routes>

        <DemoSwitcher />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;