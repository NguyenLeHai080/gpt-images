import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Plus, Bell, BookOpen, Globe, ChevronDown, LogOut, Wrench, AlertTriangle, Check } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import avatarAdmin from '../../assets/img/avatar-admin.svg';
import { systemApi, type MaintenanceStatus } from '../api/system';
import { alert } from '../alert';
import { Modal } from '../components/Modal/Modal';
import { Button } from '../components/Button/Button';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
  onOpenCreateModal?: () => void;
  onNavigateToDocs?: () => void;
  maintenanceStatus?: MaintenanceStatus | null;
  onMaintenanceChange?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  onOpenCreateModal,
  onNavigateToDocs,
  maintenanceStatus: externalMaintenance,
  onMaintenanceChange,
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // Maintenance state
  const [maintenance, setMaintenance] = useState<MaintenanceStatus | null>(externalMaintenance || null);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [targetMaintenanceMode, setTargetMaintenanceMode] = useState<boolean>(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState<string>('');
  const [isUpdatingMaintenance, setIsUpdatingMaintenance] = useState(false);

  const loadMaintenance = useCallback(async () => {
    try {
      const res = await systemApi.getMaintenance();
      if (res.data) {
        setMaintenance(res.data);
        setTargetMaintenanceMode(res.data.is_maintenance);
        setMaintenanceMsg(res.data.message || '');
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (externalMaintenance !== undefined) {
      setMaintenance(externalMaintenance);
      if (externalMaintenance) {
        setTargetMaintenanceMode(externalMaintenance.is_maintenance);
        setMaintenanceMsg(externalMaintenance.message || '');
      }
    } else {
      loadMaintenance();
    }
  }, [externalMaintenance, loadMaintenance]);

  const handleToggleMaintenanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingMaintenance(true);
    try {
      const res = await systemApi.setMaintenance(targetMaintenanceMode, maintenanceMsg);
      if (res.data) {
        setMaintenance(res.data);
        setIsMaintenanceModalOpen(false);
        if (onMaintenanceChange) onMaintenanceChange();
      }
    } catch {
      alert.toast('Lỗi khi cập nhật trạng thái bảo trì', 'error');
    } finally {
      setIsUpdatingMaintenance(false);
    }
  };


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

        {/* Super Admin API Maintenance Toggle Button */}
        {isAdmin && (
          <button
            type="button"
            onClick={() => setIsMaintenanceModalOpen(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border shadow-2xs ${
              maintenance?.is_maintenance
                ? 'bg-amber-500/15 border-amber-400 text-amber-700 animate-pulse'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
            }`}
            title="Quản lý chế độ bảo trì API toàn hệ thống"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                maintenance?.is_maintenance ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'
              }`}
            />
            <Wrench size={13} />
            <span className="hidden sm:inline">
              {maintenance?.is_maintenance ? 'BẢO TRÌ API: BẬT' : 'API: Online'}
            </span>
          </button>
        )}

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

      {/* Super Admin Maintenance Toggle Modal */}
      <Modal
        isOpen={isMaintenanceModalOpen}
        onClose={() => setIsMaintenanceModalOpen(false)}
        size="md"
        title={
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl shrink-0 ${
                targetMaintenanceMode ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              <Wrench size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Chế Độ Bảo Trì Cổng API Toàn Hệ Thống
              </h3>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                Dành riêng cho Super Admin điều phối lưu lượng
              </p>
            </div>
          </div>
        }
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setIsMaintenanceModalOpen(false)}
              disabled={isUpdatingMaintenance}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              form="maintenance-toggle-form"
              disabled={isUpdatingMaintenance}
              className={
                targetMaintenanceMode
                  ? 'bg-amber-600 hover:bg-amber-700 text-white font-bold'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold'
              }
              leftIcon={<Check size={14} />}
            >
              {isUpdatingMaintenance ? 'Đang lưu...' : 'Lưu & Áp Dụng Ngay'}
            </Button>
          </div>
        }
      >
        <form id="maintenance-toggle-form" onSubmit={handleToggleMaintenanceSubmit} className="space-y-4 text-xs text-left">
          {/* Status Switcher */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-800">
              Trạng thái hoạt động cổng API:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setTargetMaintenanceMode(false)}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  !targetMaintenanceMode
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 font-bold mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Bình Thường (Online)</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Mở cổng API nhận request tạo ảnh từ bot/tool của khách hàng.
                </p>
              </div>

              <div
                onClick={() => setTargetMaintenanceMode(true)}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  targetMaintenanceMode
                    ? 'border-amber-500 bg-amber-50/60 text-amber-900 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 font-bold mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                  <span>BẢO TRÌ (Ngưng Nhận)</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Ngưng nhận bắn từ khách, trả về lỗi 503, không trừ tiền ví của khách.
                </p>
              </div>
            </div>
          </div>

          {/* Message Input */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-800">
              Thông điệp gửi tới khách hàng (Trả trong JSON lỗi 503 & Banner Web):
            </label>
            <textarea
              rows={3}
              value={maintenanceMsg}
              onChange={(e) => setMaintenanceMsg(e.target.value)}
              placeholder="Nhập thông điệp giải thích lý do bảo trì..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Warning box */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <AlertTriangle size={14} className="text-amber-500" />
              <span>Cơ Chế Bảo Vệ Ví & Tránh Mất Tiền Khách:</span>
            </div>
            <p>
              Khi bật bảo trì, toàn bộ request từ bot/tool của khách sẽ nhận phản hồi{' '}
              <strong>HTTP 503 (system_under_maintenance)</strong>. Hệ thống cam kết{' '}
              <strong>không trừ ví khách</strong> và hiển thị banner cảnh báo trên toàn web để khách dừng
              bot.
            </p>
          </div>
        </form>
      </Modal>
    </header>
  );
};