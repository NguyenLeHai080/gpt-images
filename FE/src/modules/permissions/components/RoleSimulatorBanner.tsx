import React from 'react';
import { Eye, Check, ShieldCheck, Sparkles } from 'lucide-react';

interface RoleSimulatorBannerProps {
  currentRole?: string;
  onSwitchRole: (role: 'SUPER_ADMIN' | 'ADMIN' | 'DEVELOPER' | 'MEMBER') => void;
}

export const RoleSimulatorBanner: React.FC<RoleSimulatorBannerProps> = ({ currentRole, onSwitchRole }) => {
  const roles = [
    { code: 'SUPER_ADMIN', label: 'Super Admin', color: 'from-purple-600 to-indigo-600' },
    { code: 'ADMIN', label: 'Admin', color: 'from-brand-600 to-amber-600' },
    { code: 'DEVELOPER', label: 'Developer', color: 'from-sky-600 to-blue-600' },
    { code: 'MEMBER', label: 'Member', color: 'from-emerald-600 to-teal-600' },
  ] as const;

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white shadow-xl border border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
          <Eye size={20} className="text-brand-400 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-extrabold text-white tracking-tight">
              Live Role Simulator (Trình Giả Lập Vai Trò Trực Tiếp)
            </h3>
            <span className="text-[10px] bg-brand-500/30 text-brand-300 px-2 py-0.5 rounded-full font-bold border border-brand-400/30 flex items-center gap-1">
              <Sparkles size={11} /> 1-Click Preview
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Chuyển nhanh vai trò đang kiểm thử để trải nghiệm icon khóa 🔒 trên thanh Sidebar và quyền hạn truy cập API thực tế.
          </p>
        </div>
      </div>

      {/* Role Switcher Buttons */}
      <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-start lg:justify-end">
        {roles.map((r) => {
          const isCurrent = currentRole === r.code;
          return (
            <button
              key={r.code}
              type="button"
              onClick={() => onSwitchRole(r.code)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isCurrent
                  ? `bg-gradient-to-r ${r.color} text-white shadow-lg shadow-black/40 ring-2 ring-white/70 scale-105`
                  : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white border border-white/10'
              }`}
            >
              {isCurrent ? <Check size={13} strokeWidth={3} /> : <ShieldCheck size={13} className="text-slate-400" />}
              <span>{r.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
