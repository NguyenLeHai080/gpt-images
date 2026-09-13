import React, { useState } from 'react';
import { AuthProvider, useAuth } from './core/hooks/useAuth';
import { MainLayout } from './core/layout/MainLayout';
import { LoginPage } from './modules/auth/pages/LoginPage';
import { DashboardPage } from './modules/dashboard/pages/DashboardPage';
import { ApiKeysPage } from './modules/api-keys/pages/ApiKeysPage';
import { BillingPage } from './modules/billing/pages/BillingPage';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [previewAuthMode, setPreviewAuthMode] = useState<boolean>(false);

  // If user explicitly chooses to preview login page or is not authenticated
  if (!isAuthenticated || previewAuthMode) {
    return (
      <LoginPage
        onLoginSuccess={() => {
          setPreviewAuthMode(false);
        }}
      />
    );
  }

  // Render Dashboard Views based on Active Sidebar Tab
  const renderContent = () => {
    switch (currentTab) {
      case 'overview':
        return <DashboardPage />;
      case 'api-keys':
        return <ApiKeysPage />;
      case 'wallet':
      case 'sepay':
      case 'banking':
      case 'credit-config':
        return <BillingPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <>
      <MainLayout
        activeTab={currentTab}
        onSelectTab={(tabId) => setCurrentTab(tabId)}
        onNavigateToDocs={() => {
          window.open('/DOCS/README.md', '_blank');
        }}
      >
        {renderContent()}
      </MainLayout>

      {/* Floating Demo View Switcher (Bottom Right) */}
      <div
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 9999,
          display: 'flex',
          gap: 8,
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          padding: '6px 12px',
          borderRadius: 9999,
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
          fontSize: 12,
          fontWeight: 600,
          color: '#F8FAFC',
          alignItems: 'center',
        }}
      >
        <span style={{ color: '#F97316' }}>✨ Chế độ xem:</span>
        <button
          onClick={() => {
            setPreviewAuthMode(true);
          }}
          style={{
            backgroundColor: previewAuthMode ? '#F97316' : 'rgba(255, 255, 255, 0.1)',
            color: '#FFFFFF',
            padding: '4px 10px',
            borderRadius: 9999,
            fontSize: 11,
          }}
        >
          Trang Đăng Nhập
        </button>
        <button
          onClick={() => {
            setPreviewAuthMode(false);
          }}
          style={{
            backgroundColor: !previewAuthMode ? '#F97316' : 'rgba(255, 255, 255, 0.1)',
            color: '#FFFFFF',
            padding: '4px 10px',
            borderRadius: 9999,
            fontSize: 11,
          }}
        >
          Trang Dashboard
        </button>
      </div>
    </>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
