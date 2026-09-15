import React from 'react';
import { Sparkles, Zap, Image, ShieldCheck } from 'lucide-react';
import logoImg from '../../../assets/img/logo.svg';
import meshImg from '../../../assets/img/concentric-mesh.svg';

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
          <Sparkles size={14} className="mf-unified-badge-icon animate-pulse" />
          <span>Cổng AI Generator thế hệ mới</span>
        </div>

        <h1 className="mf-branding-title">
          Sáng tạo hình ảnh AI.<br />
          <span className="mf-gradient-orange">Tối ưu hóa lợi nhuận.</span>
        </h1>

        <p className="mf-branding-desc">
          Cổng phân phối API mô hình <strong>GPT Image 2.5 Series</strong>, tạo ảnh tức thì với Smart Cache 25ms, định giá linh hoạt và kiểm soát dòng tiền tự động.
        </p>

        {/* Feature Tags */}
        <div className="flex items-center gap-2 flex-wrap mb-7 text-xs font-semibold">
          <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-slate-300 flex items-center gap-1.5 font-mono">
            <Sparkles size={12} className="text-orange-400" /> GPT Image 2.5
          </span>
          <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-slate-300 flex items-center gap-1.5">
            <Zap size={12} className="text-amber-400" /> Smart Cache 0đ
          </span>
          <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-slate-300 flex items-center gap-1.5">
            <Image size={12} className="text-emerald-400" /> Image-to-Image
          </span>
        </div>

        {/* Social Proof / Stats Cards */}
        <div className="mf-branding-stats">
          <div className="mf-stat-card">
            <div className="mf-stat-icon-wrapper">
              <Zap size={15} className="text-amber-400" />
            </div>
            <span className="mf-stat-number">25ms</span>
            <span className="mf-stat-label">Tốc độ Smart Cache</span>
          </div>

          <div className="mf-stat-card">
            <div className="mf-stat-icon-wrapper">
              <Image size={15} className="text-orange-400" />
            </div>
            <span className="mf-stat-number">4K Ultra</span>
            <span className="mf-stat-label">Độ phân giải tối đa</span>
          </div>

          <div className="mf-stat-card">
            <div className="mf-stat-icon-wrapper">
              <ShieldCheck size={15} className="text-emerald-400" />
            </div>
            <span className="mf-stat-number">99.9%</span>
            <span className="mf-stat-label">Độ sẵn sàng hệ thống</span>
          </div>
        </div>
      </div>

      {/* Footer Copyright */}
      <div className="mf-branding-footer">
        © 2026 MintForge • Cổng AI Generator gpt-image-2
      </div>
    </div>
  );
};
