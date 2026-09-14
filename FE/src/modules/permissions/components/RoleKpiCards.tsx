import React from 'react';
import { Lock, Users, ArrowUpRight } from 'lucide-react';
import { Badge } from '../../../core/components/Badge/Badge';
import { ROLE_COLOR_MAP } from '../constants';
import type { RoleInfo } from '../types';

interface RoleKpiCardsProps {
  roles: RoleInfo[];
  matrix: Record<string, string[]>;
  totalSystemPermissions: number;
  activeRoleCode: string;
  viewMode: 'matrix' | 'detail';
  onSelectRole: (roleCode: string) => void;
}

export const RoleKpiCards: React.FC<RoleKpiCardsProps> = ({
  roles,
  matrix,
  totalSystemPermissions,
  activeRoleCode,
  viewMode,
  onSelectRole,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {roles.map((r) => {
        const rolePerms = matrix[r.code] || [];
        const percentage =
          totalSystemPermissions > 0 ? Math.round((rolePerms.length / totalSystemPermissions) * 100) : 0;
        const isSelected = activeRoleCode === r.code;
        const conf = ROLE_COLOR_MAP[r.code] || ROLE_COLOR_MAP.MEMBER;

        const borderActiveMap: Record<string, string> = {
          SUPER_ADMIN: 'border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/20',
          ADMIN: 'border-brand-500 ring-2 ring-brand-500/20 bg-orange-50/20',
          DEVELOPER: 'border-sky-500 ring-2 ring-sky-500/20 bg-sky-50/20',
          MEMBER: 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20',
        };

        return (
          <div
            key={r.code}
            onClick={() => onSelectRole(r.code)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white relative hover-lift ${
              isSelected && viewMode === 'detail'
                ? borderActiveMap[r.code] || 'border-brand-500 shadow-md ring-2 ring-brand-500/20'
                : 'border-slate-200 hover:border-slate-300 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Badge variant={conf.badge} size="sm">
                {r.code}
              </Badge>
              <span className="text-xs font-extrabold text-slate-800">
                {rolePerms.length}/{totalSystemPermissions} ({percentage}%)
              </span>
            </div>

            <h4 className="text-sm font-extrabold text-slate-900 truncate mt-1">{r.name}</h4>
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{r.description}</p>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  r.code === 'SUPER_ADMIN'
                    ? 'bg-purple-600'
                    : r.code === 'ADMIN'
                    ? 'bg-brand-500'
                    : r.code === 'DEVELOPER'
                    ? 'bg-sky-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 flex items-center gap-1 font-medium">
                <Users size={12} className="text-slate-400" />
                <span>{r.user_count} nhân sự</span>
              </span>
              {r.is_system ? (
                <span className="text-purple-600 font-bold flex items-center gap-1">
                  <Lock size={11} /> Root Admin
                </span>
              ) : (
                <span className="text-slate-500 font-medium flex items-center gap-0.5 hover:text-brand-600">
                  <span>Tùy biến</span>
                  <ArrowUpRight size={11} />
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
