import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, Sparkles } from 'lucide-react';
import { SIDEBAR_NAV_GROUPS, type NavItemConfig } from './sidebarItems';
import { useAuth } from '../hooks/useAuth';
import { alert } from '../alert';
import logoSidebar from '../../assets/img/logo-sidebar.svg';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const userRole = user?.role || 'SUPER_ADMIN';

  // Completely filter out menu items that the user doesn't have permission for
  const visibleNavGroups = useMemo(() => {
    return SIDEBAR_NAV_GROUPS.map((group) => {
      const items = group.items.filter((item) => {
        // If the item requires specific roles and the current user doesn't have it -> HIDE completely!
        if (item.requiredRoles && !item.requiredRoles.includes(userRole as any)) {
          return false;
        }
        return true;
      });

      return {
        ...group,
        items,
      };
    }).filter((group) => group.items.length > 0);
  }, [userRole]);

  const handleNavClick = (item: NavItemConfig) => {
    if (item.disabled) {
      alert.toast(`Chức năng "${item.label}" đang trong giai đoạn hoàn thiện, chưa mở truy cập.`, 'info');
      return;
    }
    navigate(item.path);
    if (onClose) onClose();
  };

  const isItemActive = (item: NavItemConfig) => {
    if (item.disabled) return false;
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

        {/* Navigation Groups - Only render groups with permitted items */}
        <div className="mf-sidebar__nav">
          {visibleNavGroups.map((group, gIdx) => {
            return (
              <div key={gIdx} className="mf-nav-group">
                <div className="mf-nav-group__header">{group.header}</div>
                {group.subHeader && <div className="mf-nav-subgroup__header">{group.subHeader}</div>}
                {group.items.map((item) => {
                  const active = isItemActive(item);
                  const isDisabled = !!item.disabled;
                  const IconComponent = item.icon;

                  return (
                    <button
                      key={item.id}
                      className={`mf-nav-item ${active ? 'mf-nav-item--active' : ''} ${
                        isDisabled
                          ? 'opacity-40 cursor-not-allowed text-slate-400 select-none hover:bg-transparent'
                          : ''
                      }`}
                      onClick={() => handleNavClick(item)}
                      title={isDisabled ? `${item.label} (Đang phát triển)` : item.label}
                    >
                      {item.isPill ? (
                        <div className="mf-nav-item__pill-icon">
                          <span className="mf-dot-inner" />
                        </div>
                      ) : IconComponent ? (
                        <IconComponent size={16} className="mf-nav-item__icon" />
                      ) : null}
                      <span className="mf-nav-item__label flex-1 text-left">{item.label}</span>

                      {isDisabled ? (
                        <span className="text-[10px] font-semibold bg-slate-100 text-slate-400 border border-slate-200/80 px-1.5 py-0.5 rounded-full shrink-0">
                          {item.badge || 'Sắp có'}
                        </span>
                      ) : item.badge ? (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                            item.badgeVariant === 'brand'
                              ? 'bg-orange-100 text-brand-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.badge}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            );
          })}
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