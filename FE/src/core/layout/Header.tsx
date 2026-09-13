import React, { useState } from 'react';
import { Search, Plus, Bell, BookOpen, Globe, ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import avatarAdmin from '../../assets/img/avatar-admin.svg';
import './layout.css';

interface HeaderProps {
  onOpenCreateModal?: () => void;
  onNavigateToDocs?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCreateModal, onNavigateToDocs }) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="mf-header">
      {/* Search Input Bar */}
      <div className="mf-header__search-container">
        <Search size={16} className="mf-search-icon" />
        <input
          type="text"
          placeholder="Tìm nhân viên, dự án, hợp đồng..."
          className="mf-search-input"
        />
        <kbd className="mf-search-kbd">⌘ K</kbd>
      </div>

      {/* Right Controls */}
      <div className="mf-header__actions">
        {/* Language Selector */}
        <button className="mf-header-btn mf-header-btn--lang">
          <Globe size={15} />
          <span>Tiếng Việt</span>
          <ChevronDown size={13} />
        </button>

        {/* Create New Button */}
        <button className="mf-btn-create" onClick={onOpenCreateModal}>
          <Plus size={16} />
          <span>Tạo mới</span>
          <ChevronDown size={14} className="mf-chevron-dim" />
        </button>

        {/* Documentation / Book icon */}
        <button
          className="mf-icon-action-btn"
          title="Tài liệu hướng dẫn (DOCS)"
          onClick={onNavigateToDocs}
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
