import React from 'react';
import {
  Users,
  KeyRound,
  ShieldCheck,
  Wallet,
  Building2,
  Sliders,
  ArrowDownToLine,
  Package,
  Receipt,
  Wrench,
  Sparkles
} from 'lucide-react';
import './layout.css';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  return (
    <aside className="mf-sidebar">
      {/* Brand Logo */}
      <div className="mf-sidebar__brand">
        <div className="mf-brand-badge">
          <span>MI</span>
        </div>
        <div className="mf-brand-info">
          <div className="mf-brand-name">MintForge</div>
          <div className="mf-brand-suite">BUSINESS SUITE</div>
        </div>
      </div>

      {/* Nav List */}
      <div className="mf-sidebar__nav">
        {/* GROUP 1: KHÔNG GIAN LÀM VIỆC */}
        <div className="mf-nav-group">
          <div className="mf-nav-group__header">KHÔNG GIAN LÀM VIỆC</div>
          <div className="mf-nav-subgroup__header">TỔNG QUAN</div>
          <button
            className={`mf-nav-item ${currentTab === 'overview' ? 'mf-nav-item--active' : ''}`}
            onClick={() => onSelectTab('overview')}
          >
            <div className="mf-nav-item__pill-icon">
              <span className="mf-dot-inner" />
            </div>
            <span className="mf-nav-item__label">Tổng quan hệ thống</span>
          </button>
        </div>

        {/* GROUP 2: TÀI KHOẢN & TRUY CẬP */}
        <div className="mf-nav-group">
          <div className="mf-nav-group__header">TÀI KHOẢN & TRUY CẬP</div>
          <button
            className={`mf-nav-item ${currentTab === 'accounts' ? 'mf-nav-item--active' : ''}`}
            onClick={() => onSelectTab('accounts')}
          >
            <Users size={16} className="mf-nav-item__icon" />
            <span className="mf-nav-item__label">Tài khoản</span>
          </button>
          <button
            className={`mf-nav-item ${currentTab === 'api-keys' ? 'mf-nav-item--active' : ''}`}
            onClick={() => onSelectTab('api-keys')}
          >
            <KeyRound size={16} className="mf-nav-item__icon" />
            <span className="mf-nav-item__label">API Keys & gói dịch vụ</span>
          </button>
          <button
            className={`mf-nav-item ${currentTab === 'permissions' ? 'mf-nav-item--active' : ''}`}
            onClick={() => onSelectTab('permissions')}
          >
            <ShieldCheck size={16} className="mf-nav-item__icon" />
            <span className="mf-nav-item__label">Phân quyền</span>
          </button>
        </div>

        {/* GROUP 3: CREDIT & THANH TOÁN */}
        <div className="mf-nav-group">
          <div className="mf-nav-group__header">CREDIT & THANH TOÁN</div>
          <button
            className={`mf-nav-item ${currentTab === 'wallet' ? 'mf-nav-item--active' : ''}`}
            onClick={() => onSelectTab('wallet')}
          >
            <Wallet size={16} className="mf-nav-item__icon" />
            <span className="mf-nav-item__label">Ví & dòng tiền</span>
          </button>
          <button
            className={`mf-nav-item ${currentTab === 'banking' ? 'mf-nav-item--active' : ''}`}
            onClick={() => onSelectTab('banking')}
          >
            <Building2 size={16} className="mf-nav-item__icon" />
            <span className="mf-nav-item__label">Ngân hàng & QR</span>
          </button>
          <button
            className={`mf-nav-item ${currentTab === 'credit-config' ? 'mf-nav-item--active' : ''}`}
            onClick={() => onSelectTab('credit-config')}
          >
            <Sliders size={16} className="mf-nav-item__icon" />
            <span className="mf-nav-item__label">Cấu hình Credit</span>
          </button>
          <button
            className={`mf-nav-item ${currentTab === 'sepay' ? 'mf-nav-item--active' : ''}`}
            onClick={() => onSelectTab('sepay')}
          >
            <ArrowDownToLine size={16} className="mf-nav-item__icon" />
            <span className="mf-nav-item__label">Giao dịch nạp SePay</span>
          </button>
        </div>

        {/* GROUP 4: CẤU HÌNH DỊCH VỤ */}
        <div className="mf-nav-group">
          <div className="mf-nav-group__header">CẤU HÌNH DỊCH VỤ</div>
          <button
            className={`mf-nav-item ${currentTab === 'packages' ? 'mf-nav-item--active' : ''}`}
            onClick={() => onSelectTab('packages')}
          >
            <Package size={16} className="mf-nav-item__icon" />
            <span className="mf-nav-item__label">Cấu hình gói</span>
          </button>
          <button
            className={`mf-nav-item ${currentTab === 'pricing' ? 'mf-nav-item--active' : ''}`}
            onClick={() => onSelectTab('pricing')}
          >
            <Receipt size={16} className="mf-nav-item__icon" />
            <span className="mf-nav-item__label">Bảng giá model</span>
          </button>
          <button
            className={`mf-nav-item ${currentTab === 'tools' ? 'mf-nav-item--active' : ''}`}
            onClick={() => onSelectTab('tools')}
          >
            <Wrench size={16} className="mf-nav-item__icon" />
            <span className="mf-nav-item__label">Cài đặt công cụ</span>
          </button>
        </div>
      </div>

      {/* Upgrade Banner Card */}
      <div className="mf-sidebar__upgrade-card">
        <div className="mf-upgrade-header">
          <Sparkles size={16} className="mf-sparkle-icon" />
          <span>Nâng cấp doanh nghiệp</span>
        </div>
        <p className="mf-upgrade-desc">
          Mở khóa báo cáo nâng cao và tự động hóa.
        </p>
        <button className="mf-upgrade-button">
          Tìm hiểu thêm
        </button>
      </div>
    </aside>
  );
};
