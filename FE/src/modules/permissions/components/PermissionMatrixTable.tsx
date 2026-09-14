import React, { useState, useMemo } from 'react';
import { Check, CheckCircle2, Save, Shield, Layers } from 'lucide-react';
import { Table, type Column } from '../../../core/components/Table';
import { Badge } from '../../../core/components/Badge/Badge';
import { Button } from '../../../core/components/Button/Button';
import { MODULE_META, ROLE_COLOR_MAP } from '../constants';
import type { RoleInfo, PermissionGroup } from '../types';

export interface PermissionTableRow {
  id: string;
  action_key: string;
  label: string;
  description: string;
  module_key: string;
  module_name: string;
}

interface PermissionMatrixTableProps {
  roles: RoleInfo[];
  modules: PermissionGroup[];
  matrix: Record<string, string[]>;
  search: string;
  isSaving: boolean;
  onTogglePermission: (roleCode: string, actionKey: string) => void;
  onSaveAllMatrix: () => void;
}

export const PermissionMatrixTable: React.FC<PermissionMatrixTableProps> = ({
  roles,
  modules,
  matrix,
  search,
  isSaving,
  onTogglePermission,
  onSaveAllMatrix,
}) => {
  // Module filter tab
  const [selectedModule, setSelectedModule] = useState<string>('all');

  // Flatten modules into rows for the core Table
  const allRows: PermissionTableRow[] = useMemo(() => {
    const rows: PermissionTableRow[] = [];
    modules.forEach((mod) => {
      mod.actions.forEach((act) => {
        rows.push({
          id: act.key,
          action_key: act.key,
          label: act.label,
          description: act.description,
          module_key: mod.module_key,
          module_name: mod.module_name,
        });
      });
    });
    return rows;
  }, [modules]);

  // Filter rows based on search and selectedModule
  const filteredData = useMemo(() => {
    return allRows.filter((row) => {
      const matchModule = selectedModule === 'all' || row.module_key === selectedModule;
      if (!matchModule) return false;

      if (!search.trim()) return true;
      const term = search.toLowerCase().trim();
      return (
        row.label.toLowerCase().includes(term) ||
        row.action_key.toLowerCase().includes(term) ||
        row.description.toLowerCase().includes(term) ||
        row.module_name.toLowerCase().includes(term)
      );
    });
  }, [allRows, selectedModule, search]);

  // Define Table Columns
  const columns: Column<PermissionTableRow>[] = useMemo(() => {
    const cols: Column<PermissionTableRow>[] = [
      {
        key: 'permission',
        title: (
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-slate-500" />
            <span>Phân Hệ & Danh Sách Đặc Quyền ({filteredData.length})</span>
          </div>
        ),
        render: (_, record) => {
          const meta = MODULE_META[record.module_key] || MODULE_META.system;

          return (
            <div className="flex items-start gap-3 py-1">
              <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${meta.bg} border ${meta.border}`}>
                {meta.icon}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-900 text-xs">{record.label}</span>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    {record.action_key}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.bg} ${meta.text}`}>
                    {record.module_name}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-1">{record.description}</p>
              </div>
            </div>
          );
        },
      },
    ];

    // Add 1 column per role
    roles.forEach((r) => {
      const conf = ROLE_COLOR_MAP[r.code] || ROLE_COLOR_MAP.MEMBER;
      const activeCount = matrix[r.code]?.length || 0;
      const totalCount = allRows.length;

      cols.push({
        key: `role_${r.code}`,
        align: 'center',
        title: (
          <div className="flex flex-col items-center gap-1 py-1">
            <Badge variant={conf.badge} size="sm">
              {r.code}
            </Badge>
            <span className="text-[10px] font-extrabold text-slate-600">
              {activeCount}/{totalCount} quyền
            </span>
          </div>
        ),
        render: (_, record) => {
          const rolePerms = matrix[r.code] || [];
          const isChecked = rolePerms.includes(record.action_key);

          return (
            <div className="flex items-center justify-center py-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePermission(r.code, record.action_key);
                }}
                className={`w-4 h-4 rounded-[4px] flex items-center justify-center transition-all duration-150 cursor-pointer ${
                  isChecked
                    ? r.code === 'SUPER_ADMIN'
                      ? 'bg-purple-600 border border-purple-600 text-white shadow-2xs'
                      : r.code === 'ADMIN'
                      ? 'bg-brand-600 border border-brand-600 text-white shadow-2xs'
                      : r.code === 'DEVELOPER'
                      ? 'bg-sky-600 border border-sky-600 text-white shadow-2xs'
                      : 'bg-emerald-600 border border-emerald-600 text-white shadow-2xs'
                    : 'bg-white border border-slate-300 text-transparent hover:border-slate-400 hover:bg-slate-50'
                }`}
                title={`${isChecked ? 'Đang cấp quyền' : 'Chưa cấp quyền'} cho vai trò ${r.code}`}
              >
                <Check size={11} strokeWidth={3} className={isChecked ? 'opacity-100 scale-100' : 'opacity-0 scale-75'} />
              </button>
            </div>
          );
        },
      });
    });

    return cols;
  }, [roles, matrix, allRows.length, filteredData.length, onTogglePermission]);

  return (
    <div className="flex flex-col gap-4">
      {/* Module Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar-light">
        <button
          type="button"
          onClick={() => setSelectedModule('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            selectedModule === 'all'
              ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <Layers size={13} />
          <span>Tất cả phân hệ</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              selectedModule === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {allRows.length}
          </span>
        </button>

        {modules.map((mod) => {
          const isSelected = selectedModule === mod.module_key;
          const meta = MODULE_META[mod.module_key] || MODULE_META.system;

          return (
            <button
              key={mod.module_key}
              type="button"
              onClick={() => setSelectedModule(mod.module_key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-brand-600 text-white shadow-sm ring-2 ring-brand-500/20'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className="shrink-0">{meta.icon}</span>
              <span>{mod.module_name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {mod.actions.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Shared Core Table Component */}
      <Table<PermissionTableRow>
        columns={columns}
        data={filteredData}
        emptyText="Không tìm thấy đặc quyền nào phù hợp với bộ lọc tìm kiếm"
        pagination={{
          pageSize: 10,
          pageSizeOptions: [10, 20, 50],
        }}
        bordered
      />

      {/* Sticky Bottom Action Footer */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5 text-xs text-slate-600">
          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 size={14} />
          </div>
          <span>
            Bấm trực tiếp vào các nút toggle để bật/tắt quyền cho từng vai trò. Dữ liệu bảng dùng chung chuẩn Core UI.
          </span>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<Save size={15} />}
          onClick={onSaveAllMatrix}
          isLoading={isSaving}
        >
          Lưu toàn bộ ma trận phân quyền
        </Button>
      </div>
    </div>
  );
};
