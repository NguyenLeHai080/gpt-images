import React, { useState, useMemo } from 'react';
import {
  Save,
  RotateCcw,
  Search,
  LayoutGrid,
  Table as TableIcon,
  X,
} from 'lucide-react';
import { Button } from '../../../core/components/Button/Button';
import { useAuth } from '../../../core/hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { RoleSimulatorBanner } from '../components/RoleSimulatorBanner';
import { RoleKpiCards } from '../components/RoleKpiCards';
import { PermissionMatrixTable } from '../components/PermissionMatrixTable';
import { RoleDetailView } from '../components/RoleDetailView';

export const PermissionsPage: React.FC = () => {
  const { user, switchRole } = useAuth();
  const {
    roles,
    modules,
    matrix,
    isLoading,
    isSaving,
    togglePermission,
    toggleModulePermissions,
    saveRolePermissions,
    saveAllMatrix,
    resetDefaults,
  } = usePermissions();

  // View mode: 'matrix' (shared Table core) or 'detail' (single role view)
  const [viewMode, setViewMode] = useState<'matrix' | 'detail'>('matrix');

  // Active role selected for Single Role Detail View
  const [activeRoleCode, setActiveRoleCode] = useState<string>('SUPER_ADMIN');

  // Search query
  const [search, setSearch] = useState<string>('');

  // Calculate total system permissions count
  const totalSystemPermissions = useMemo(() => {
    return modules.reduce((acc, m) => acc + m.actions.length, 0);
  }, [modules]);

  // Filter modules for RoleDetailView
  const filteredModules = useMemo(() => {
    if (!search.trim()) return modules;
    const term = search.toLowerCase().trim();

    return modules
      .map((mod) => {
        const matchingActions = mod.actions.filter(
          (a) =>
            a.label.toLowerCase().includes(term) ||
            a.description.toLowerCase().includes(term) ||
            a.key.toLowerCase().includes(term) ||
            mod.module_name.toLowerCase().includes(term)
        );
        return {
          ...mod,
          actions: matchingActions,
        };
      })
      .filter((mod) => mod.actions.length > 0);
  }, [modules, search]);

  const activeRoleInfo = roles.find((r) => r.code === activeRoleCode) || roles[0];
  const activePermissions = matrix[activeRoleCode] || [];

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      {/* 1. Header & Primary Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Ma Trận Phân Quyền RBAC</h1>
            <span className="text-xs bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full font-bold border border-purple-200 shadow-2xs">
              {totalSystemPermissions} Đặc Quyền Hệ Thống
            </span>
            <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full font-bold border border-brand-200">
              Core Table UI
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Bảng ma trận đối chiếu trực quan quyền hạn phân theo 4 vai trò và 5 phân hệ nghiệp vụ, đồng bộ dùng chung Core UI Table.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            leftIcon={<RotateCcw size={15} />}
            onClick={resetDefaults}
            disabled={isSaving || isLoading}
          >
            Khôi phục mặc định
          </Button>
          <Button
            variant="primary"
            size="md"
            leftIcon={<Save size={15} />}
            onClick={viewMode === 'matrix' ? saveAllMatrix : () => saveRolePermissions(activeRoleCode)}
            isLoading={isSaving}
            disabled={isLoading}
          >
            {viewMode === 'matrix' ? 'Lưu toàn bộ ma trận' : `Lưu vai trò ${activeRoleCode}`}
          </Button>
        </div>
      </div>

      {/* 2. Live Role Simulator Banner */}
      <RoleSimulatorBanner
        currentRole={user?.role}
        onSwitchRole={(rCode) => switchRole(rCode)}
      />

      {/* 3. 4 Role KPI Summary Cards */}
      <RoleKpiCards
        roles={roles}
        matrix={matrix}
        totalSystemPermissions={totalSystemPermissions}
        activeRoleCode={activeRoleCode}
        viewMode={viewMode}
        onSelectRole={(code) => {
          setActiveRoleCode(code);
          if (viewMode !== 'detail') {
            setViewMode('detail');
          }
        }}
      />

      {/* 4. Toolbar: Search Filter & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        {/* Search Bar */}
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm quyền theo tên (vd: tạo ảnh, api key, số dư, xóa)..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'matrix'
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon size={14} />
              <span>Bảng Ma Trận (Core Table)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('detail')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'detail'
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid size={14} />
              <span>Xem Theo Vai Trò</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. VIEW MODE A: BẢNG ĐỐI CHIẾU MA TRẬN DÙNG CHUNG CORE TABLE */}
      {viewMode === 'matrix' && (
        <PermissionMatrixTable
          roles={roles}
          modules={modules}
          matrix={matrix}
          search={search}
          isSaving={isSaving}
          onTogglePermission={togglePermission}
          onSaveAllMatrix={saveAllMatrix}
        />
      )}

      {/* 6. VIEW MODE B: XEM CHI TIẾT TỪNG VAI TRÒ */}
      {viewMode === 'detail' && (
        <RoleDetailView
          activeRoleInfo={activeRoleInfo}
          activeRoleCode={activeRoleCode}
          activePermissions={activePermissions}
          totalSystemPermissions={totalSystemPermissions}
          filteredModules={filteredModules}
          isSaving={isSaving}
          onResetDefaults={resetDefaults}
          onSaveRole={saveRolePermissions}
          onTogglePermission={togglePermission}
          onToggleModulePermissions={toggleModulePermissions}
        />
      )}
    </div>
  );
};
export default PermissionsPage;
