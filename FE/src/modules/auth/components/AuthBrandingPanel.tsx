import React from 'react';
import { Sparkles } from 'lucide-react';
import logoImg from '../../../assets/img/logo.svg';
import meshImg from '../../../assets/img/concentric-mesh.svg';
import '../pages/login.css';

export const AuthBrandingPanel: React.FC = () => {
  return (
    <div className="mf-auth-branding bg-radial-glow">
      {/* Background Concentric Circles Graphic */}
      <div className="mf-branding-decor" aria-hidden="true">
        <img src={meshImg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none" />
        <div className="mf-circle mf-circle--1" />
        <div className="mf-circle mf-circle--2" />
        <div className="mf-circle mf-circle--3" />
      </div>

      {/* Top Brand Logo */}
      <div className="mf-branding-header">
        <img src={logoImg} alt="MintForge Logo" className="h-8 w-auto object-contain" />
      </div>

      {/* Center Value Proposition */}
      <div className="mf-branding-content">
        <div className="mf-unified-badge">
          <Sparkles size={14} className="mf-unified-badge-icon" />
          <span>Quản trị doanh nghiệp hợp nhất</span>
        </div>

        <h1 className="mf-branding-title">
          Vận hành đội ngũ.<br />
          <span className="mf-gradient-orange">Tăng tốc tăng trưởng.</span>
        </h1>

        <p className="mf-branding-desc">
          Quản lý nhân sự, hợp đồng, dự án và tài chính trong một không gian làm việc hiện đại.
        </p>

        {/* Social Proof / Stats */}
        <div className="mf-branding-stats">
          <div className="mf-stat-item">
            <span className="mf-stat-number">248+</span>
            <span className="mf-stat-label">Nhân viên đang kết nối</span>
          </div>
          <div className="mf-stat-item">
            <span className="mf-stat-number">99.9%</span>
            <span className="mf-stat-label">Thời gian hoạt động</span>
          </div>
        </div>
      </div>

      {/* Footer Copyright */}
      <div className="mf-branding-footer">
        © 2026 MintForge Business Suite
      </div>
    </div>
  );
};
