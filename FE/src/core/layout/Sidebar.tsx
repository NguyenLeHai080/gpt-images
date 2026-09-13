import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, Sparkles } from 'lucide-react';
import { SIDEBAR_NAV_GROUPS, type NavItemConfig } from './sidebarItems';
import logoSidebar from '../../assets/img/logo-sidebar.svg';
import './layout.css';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavClick = (item: NavItemConfig) => {
    navigate(item.path);
    if (onClose) onClose();
  };

  const isItemActive = (item: NavItemConfig) => {
    if (item.path === '/app/overview' && (location.pathname === '/app/overview' || location.pathname === '/app')) {
      return true;
    }
    return location.pathname === item.path;
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && <div className="mf-sidebar-backdrop" onClick={onClose} />}

      <aside className={`mf-sidebar ${isOpen ? 'mf-sidebar--open' : ''}`}>
        {/* Brand Logo & Close Button for Mobile */}
        <div className="mf-sidebar__brand">
          <img src={logoSidebar} alt="MintForge Business Suite" className="h-9 w-auto object-contain" />
          <button className="mf-sidebar-close-btn" onClick={onClose} title="Đóng menu">
            <X size={20} />
          </button>
        </div>

        {/* Navigation Groups */}
        <div className="mf-sidebar__nav">
          {SIDEBAR_NAV_GROUPS.map((group, gIdx) => (
            <div key={gIdx} className="mf-nav-group">
              <div className="mf-nav-group__header">{group.header}</div>
              {group.subHeader && <div className="mf-nav-subgroup__header">{group.subHeader}</div>}
              {group.items.map((item) => {
                const active = isItemActive(item);
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    className={`mf-nav-item ${active ? 'mf-nav-item--active' : ''}`}
                    onClick={() => handleNavClick(item)}
                  >
                    {item.isPill ? (
                      <div className="mf-nav-item__pill-icon">
                        <span className="mf-dot-inner" />
                      </div>
                    ) : IconComponent ? (
                      <IconComponent size={16} className="mf-nav-item__icon" />
                    ) : null}
                    <span className="mf-nav-item__label">{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Upgrade Card */}
        <div className="mf-sidebar__upgrade-card">
          <div className="mf-upgrade-header">
            <Sparkles size={16} className="mf-sparkle-icon" />
            <span>Nâng cấp doanh nghiệp</span>
          </div>
          <p className="mf-upgrade-desc">Mở khóa báo cáo nâng cao và tự động hóa.</p>
          <button className="mf-upgrade-button">Tìm hiểu thêm</button>
        </div>
      </aside>
    </>
  );
};