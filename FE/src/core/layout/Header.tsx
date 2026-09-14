import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Plus, Bell, BookOpen, Globe, ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import avatarAdmin from '../../assets/img/avatar-admin.svg';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
  onOpenCreateModal?: () => void;
  onNavigateToDocs?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  onOpenCreateModal,
  onNavigateToDocs,
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const handleDocsClick = () => {
    if (onNavigateToDocs) {
      onNavigateToDocs();
    } else {
      navigate('/app/api-docs');
    }
  };

  return (
    <header className="mf-header">
      {/* Left: Mobile Menu Toggle & Search */}
      <div className="mf-header__left">
        <button
          className="mf-header-menu-btn"
          onClick={onToggleMobileMenu}
          title="Mở menu điều hướng"
          aria-label="Toggle navigation"
        >
          <Menu size={22} />
        </button>

        {/* Search Input Bar */}
        {/* <div className={`mf-header__search-container ${showMobileSearch ? 'mf-header__search--visible' : ''}`}>
          <Search size={16} className="mf-search-icon" />
          <input
            type="text"
            placeholder="Tìm nhân viên, dự án, hợp đồng..."
            className="mf-search-input"
          />
          <kbd className="mf-search-kbd">⌘ K</kbd>
        </div> */}
      </div>

      {/* Right Controls */}
      <div className="mf-header__actions">
        {/* Mobile Search Toggle Button */}
        <button
          className="mf-icon-action-btn mf-mobile-search-toggle"
          onClick={() => setShowMobileSearch(!showMobileSearch)}
          title="Tìm kiếm"
        >
          <Search size={18} />
        </button>

        {/* Language Selector (Hidden on mobile) */}
        <button className="mf-header-btn mf-header-btn--lang">
          <Globe size={15} />
          <span className="mf-btn-text">Tiếng Việt</span>
          <ChevronDown size={13} />
        </button>

        {/* Create New Button */}
        <button className="mf-btn-create" onClick={onOpenCreateModal}>
          <Plus size={16} />
          <span className="mf-btn-text">Tạo mới</span>
          <ChevronDown size={14} className="mf-chevron-dim mf-btn-text" />
        </button>

        {/* Documentation icon */}
        <button
          className="mf-icon-action-btn mf-header-docs-btn"
          title="Tài liệu hướng dẫn (DOCS)"
          onClick={handleDocsClick}
        >
          <BookOpen size={18} />
        </button>

        {/* Notification Bell */}
        <button className="mf-icon-action-btn mf-icon-action-btn--has-badge" title="Thông báo">
          <Bell size={18} />
          <span className="mf-bell-badge">3</span>
        </button>

        {/* User Profile */}
        <div className="mf-user-profile-wrapper">
          <button
            className="mf-user-profile-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <img
              src={user?.avatar_url || avatarAdmin}
              alt={user?.full_name || 'Admin'}
              className="mf-user-avatar"
            />
            <div className="mf-user-details">
              <span className="mf-user-name">{user?.full_name || 'Admin'}</span>
              <span className="mf-user-role">{user?.role || 'SUPER_ADMIN'}</span>
            </div>
            <ChevronDown size={14} className="mf-user-chevron" />
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className="mf-user-dropdown animate-fade-in">
              <div className="mf-dropdown-header">
                <div className="mf-dropdown-email">{user?.email || 'admin@mintforge.vn'}</div>
                <div className="mf-dropdown-company">{user?.company_name || 'MintForge Business Suite'}</div>
              </div>
              <div className="mf-dropdown-divider" />
              <button
                className="mf-dropdown-item mf-dropdown-item--danger"
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                }}
              >
                <LogOut size={15} />
                <span>Đăng xuất tài khoản</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};