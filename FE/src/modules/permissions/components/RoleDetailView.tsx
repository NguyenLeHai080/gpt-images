import React from 'react';
import { Shield, RotateCcw, Save } from 'lucide-react';
import { Card } from '../../../core/components/Card/Card';
import { Badge } from '../../../core/components/Badge/Badge';
import { Button } from '../../../core/components/Button/Button';
import { Checkbox } from '../../../core/components/Checkbox/Checkbox';
import { MODULE_META, ROLE_COLOR_MAP } from '../constants';
import type { RoleInfo, PermissionGroup } from '../types';

interface RoleDetailViewProps {
  activeRoleInfo?: RoleInfo;
  activeRoleCode: string;
  activePermissions: string[];
  totalSystemPermissions: number;
  filteredModules: PermissionGroup[];
  isSaving: boolean;
  onResetDefaults: () => void;
  onSaveRole: (roleCode: string) => void;
  onTogglePermission: (roleCode: string, actionKey: string) => void;
  onToggleModulePermissions: (roleCode: string, actionKeys: string[], enable: boolean) => void;
}

export const RoleDetailView: React.FC<RoleDetailViewProps> = ({
  activeRoleInfo,
  activeRoleCode,
  activePermissions,
  totalSystemPermissions,
  filteredModules,
  isSaving,
  onResetDefaults,
  onSaveRole,
  onTogglePermission,
  onToggleModulePermissions,
}) => {
  return (
    <Card padding="none" className="overflow-hidden border border-slate-200 shadow-card">
      {/* Header Banner */}
      <div className="p-5 bg-gradient-to-r from-slate-50 to-orange-50/40 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
            <Shield size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Cấu Hình Vai Trò: <span className="text-brand-600">{activeRoleInfo?.name}</span>
              </h3>
              <Badge variant={ROLE_COLOR_MAP[activeRoleCode]?.badge || 'brand'} size="sm">
                {activeRoleCode}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Đang bật <strong className="text-slate-800">{activePermissions.length}</strong> / {totalSystemPermissions} quyền hạn.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RotateCcw size={13} />}
            onClick={onResetDefaults}
            disabled={isSaving}
          >
            Đặt lại
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Save size={14} />}
            onClick={() => onSaveRole(activeRoleCode)}
            isLoading={isSaving}
          >
            Lưu vai trò này
          </Button>
        </div>
      </div>

      {/* Module Permission Groups */}
      <div className="divide-y divide-slate-100">
        {filteredModules.map((mod) => {
          const meta = MODULE_META[mod.module_key] || MODULE_META.system;
          const actionKeys = mod.actions.map((a) => a.key);
          const selectedInModule = actionKeys.filter((k) => activePermissions.includes(k));
          const isAllSelected = selectedInModule.length === actionKeys.length && actionKeys.length > 0;

          return (
            <div key={mod.module_key} className="p-5 hover:bg-slate-50/40 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-slate-100">{meta.icon}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-800">{mod.module_name}</h4>
                      <span className="text-[11px] text-slate-400 font-medium">
                        ({selectedInModule.length}/{actionKeys.length} quyền)
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{mod.description}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleModulePermissions(activeRoleCode, actionKeys, !isAllSelected)}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100/70 px-3 py-1.5 rounded-lg transition-colors"
                >
                  {isAllSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {mod.actions.map((action) => {
                  const isChecked = activePermissions.includes(action.key);

                  return (
                    <div
                      key={action.key}
                      onClick={() => onTogglePermission(activeRoleCode, action.key)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                        isChecked
                          ? 'border-brand-500/60 bg-orange-50/40 shadow-xs ring-1 ring-brand-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <Checkbox
                        checked={isChecked}
                        onChange={() => onTogglePermission(activeRoleCode, action.key)}
                        id={`chk-detail-${activeRoleCode}-${action.key}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">{action.label}</span>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1 rounded">
                            {action.key}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{action.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <span className="text-xs text-slate-500">Thay đổi vai trò sẽ có hiệu lực ngay lập tức.</span>
        <Button
          variant="primary"
          size="md"
          leftIcon={<Save size={15} />}
          onClick={() => onSaveRole(activeRoleCode)}
          isLoading={isSaving}
        >
          Lưu thay đổi vai trò
        </Button>
      </div>
    </Card>
  );
};
