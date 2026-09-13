import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import './layout.css';

interface MainLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  onSelectTab?: (tabId: string) => void;
  onNavigateToDocs?: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  activeTab = 'overview',
  onSelectTab,
  onNavigateToDocs
}) => {
  const [currentTab, setCurrentTab] = useState(activeTab);

  const handleSelectTab = (tabId: string) => {
    setCurrentTab(tabId);
    if (onSelectTab) {
      onSelectTab(tabId);
    }
  };

  return (
    <div className="mf-main-layout">
      {/* Sidebar Left */}
      <Sidebar currentTab={currentTab} onSelectTab={handleSelectTab} />

      {/* Main Area Right */}
      <div className="mf-main-area">
        <Header onNavigateToDocs={onNavigateToDocs} />
        <main className="mf-content-container">
          {children}
        </main>
      </div>
    </div>
  );
};
