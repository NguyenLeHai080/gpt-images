import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface MainLayoutProps {
  children: React.ReactNode;
  onNavigateToDocs?: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  onNavigateToDocs,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="mf-main-layout">
      {/* Sidebar (Responsive Drawer on Mobile) */}
      <Sidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Area Right */}
      <div className="mf-main-area">
        <Header
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          onNavigateToDocs={onNavigateToDocs}
        />
        <main className="mf-content-container">
          {children}
        </main>
      </div>
    </div>
  );
};