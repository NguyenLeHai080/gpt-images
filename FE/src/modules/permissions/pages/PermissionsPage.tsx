import React, { useState, useMemo } from 'react';
import {
  Users,
  KeyRound,
  Wallet,
  Sparkles,
  Settings,
  Save,
  RotateCcw,
  Check,
  Search,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Table as TableIcon,
  Shield,
  Eye,
  SlidersHorizontal,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { Button } from '../../../core/components/Button/Button';
import { Badge } from '../../../core/components/Badge/Badge';
import { Card } from '../../../core/components/Card/Card';
import { Checkbox } from '../../../core/components/Checkbox/Checkbox';
import { useAuth } from '../../../core/hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';

const MODULE_META: Record<string, { icon: React.ReactNode; bg: string; text: string; border: string }> = {
  accounts: {
    icon: <Users size={17} className="text-brand-600" />,
    bg: 'bg-orange-50',
    text: 'text-brand-700',
    border: 'border-orange-200',
  },
  apikeys: {
    icon: <KeyRound size={17} className="text-sky-600" />,
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
  },
  billing: {
    icon: <Wallet size={17} className="text-emerald-600" />,
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  ai_studio: {
    icon: <Sparkles size={17} className="text-purple-600" />,
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  system: {
    icon: <Settings size={17} className="text-slate-600" />,
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
  },
};

const ROLE_COLOR_MAP: Record<string, { badge: 'purple' | 'brand' | 'info' | 'success'; headerBg: string; text: string; border: string }> = {
  SUPER_ADMIN: { badge: 'purple', headerBg: 'bg-purple-50/60', text: 'text-purple-700', border: 'border-purple-200' },
  ADMIN: { badge: 'brand', headerBg: 'bg-orange-50/60', text: 'text-brand-700', border: 'border-orange-200' },
  DEVELOPER: { badge: 'info', headerBg: 'bg-sky-50/60', text: 'text-sky-700', border: 'border-sky-200' },
  MEMBER: { badge: 'success', headerBg: 'bg-emerald-50/60', text: 'text-emerald-700', border: 'border-emerald-200' },
};

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

  // View mode: 'matrix' (full comparison table) or 'detail' (single role view)
  const [viewMode, setViewMode] = useState<'matrix' | 'detail'>('matrix');

  // Active role selected for Single Role Detail View
  const [activeRoleCode, setActiveRoleCode] = useState<string>('SUPER_ADMIN');

  // Search query
  const [search, setSearch] = useState<string>('');

  // Accordion collapsed modules state
  const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({});

  // Toggle collapse
  const toggleCollapse = (moduleKey: string) => {
    setCollapsedModules((prev) => ({ ...prev, [moduleKey]: !prev[moduleKey] }));
  };

  // Expand / Collapse All
  const handleToggleExpandAll = () => {
    const anyCollapsed = Object.values(collapsedModules).some((v) => v);
    if (anyCollapsed) {
      setCollapsedModules({});
    } else {
      const all: Record<string, boolean> = {};
      modules.forEach((m) => {
        all[m.module_key] = true;
      });
      setCollapsedModules(all);
    }
  };

  // Calculate total system permissions count
  const totalSystemPermissions = useMemo(() => {
    return modules.reduce((acc, m) => acc + m.actions.length, 0);
  }, [modules]);

  // Filter modules and actions by search
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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Ma Trận Phân Quyền RBAC</h1>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold border border-purple-200">
              {totalSystemPermissions} Đặc Quyền Hệ Thống
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Bảng ma trận đối chiếu trực quan quyền hạn phân theo 4 vai trò và 5 phân hệ nghiệp vụ.
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
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white shadow-xl border border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
            <Eye size={18} className="text-brand-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Live Role Simulator (Trình Giả Lập Vai Trò Trực Tiếp)</h3>
              <span className="text-[10px] bg-brand-500/30 text-brand-300 px-2 py-0.5 rounded-full font-bold border border-brand-400/30">
                1-Click Preview
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Chuyển nhanh vai trò đang đăng nhập để kiểm tra icon khóa 🔒 trên Sidebar và quyền hạn truy cập thực tế.
            </p>
          </div>
        </div>

        {/* Role Switcher Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {(['SUPER_ADMIN', 'ADMIN', 'DEVELOPER', 'MEMBER'] as const).map((rCode) => {
            const isCurrent = user?.role === rCode;
            return (
              <button
                key={rCode}
                type="button"
                onClick={() => switchRole(rCode)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isCurrent
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30 ring-2 ring-white/60 scale-105'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
                }`}
              >
                {isCurrent && <Check size={13} strokeWidth={3} />}
                <span>{rCode}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. 4 Role KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {roles.map((r) => {
          const rolePerms = matrix[r.code] || [];
          const percentage = totalSystemPermissions > 0 ? Math.round((rolePerms.length / totalSystemPermissions) * 100) : 0;
          const isSelected = activeRoleCode === r.code;
          const conf = ROLE_COLOR_MAP[r.code] || ROLE_COLOR_MAP.MEMBER;

          return (
            <div
              key={r.code}
              onClick={() => {
                setActiveRoleCode(r.code);
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white relative ${
                isSelected && viewMode === 'detail'
                  ? 'border-brand-500 shadow-md ring-2 ring-brand-500/20'
                  : 'border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Badge variant={conf.badge} size="sm">
                  {r.code}
                </Badge>
                <span className="text-xs font-extrabold text-slate-700">
                  {rolePerms.length}/{totalSystemPermissions} quyền ({percentage}%)
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-900 truncate">{r.name}</h4>
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
                <span className="text-slate-400">Nhân sự: {r.user_count} user</span>
                {r.is_system ? (
                  <span className="text-purple-600 font-semibold flex items-center gap-1">
                    <Lock size={11} /> Root Admin
                  </span>
                ) : (
                  <span className="text-slate-500 font-medium">Tùy biến được</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

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
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
          />
        </div>

        {/* View Mode Switcher & Expand/Collapse Toggle */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleToggleExpandAll}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <SlidersHorizontal size={13} />
            <span>Đóng/Mở tất cả</span>
          </button>

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
              <span>Bảng Đối Chiếu Ma Trận</span>
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

      {/* 5. VIEW MODE A: BẢNG ĐỐI CHIẾU MA TRẬN TỔNG THỂ (CROSS-TABULAR COMPARISON MATRIX) */}
      {viewMode === 'matrix' && (
        <Card padding="none" className="overflow-hidden border border-slate-200 shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              {/* Matrix Table Sticky Header */}
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-800">
                  <th className="py-4 px-5 font-bold uppercase tracking-wider text-slate-600 w-2/5 min-w-[300px]">
                    Phân Hệ & Danh Sách Đặc Quyền
                  </th>
                  {roles.map((r) => {
                    const conf = ROLE_COLOR_MAP[r.code] || ROLE_COLOR_MAP.MEMBER;
                    const rPerms = matrix[r.code] || [];
                    return (
                      <th
                        key={r.code}
                        className={`py-4 px-4 text-center font-bold min-w-[140px] border-l border-slate-200 ${conf.headerBg}`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <Badge variant={conf.badge} size="sm">
                            {r.code}
                          </Badge>
                          <span className="text-[11px] font-extrabold text-slate-700">
                            {rPerms.length} quyền
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* Matrix Table Body */}
              <tbody className="divide-y divide-slate-100">
                {filteredModules.length === 0 ? (
                  <tr>
                    <td colSpan={1 + roles.length} className="py-12 text-center text-slate-400 font-medium text-xs">
                      Không tìm thấy đặc quyền nào khớp với từ khóa "{search}"
                    </td>
                  </tr>
                ) : (
                  filteredModules.map((mod) => {
                    const meta = MODULE_META[mod.module_key] || MODULE_META.system;
                    const isCollapsed = collapsedModules[mod.module_key];

                    return (
                      <React.Fragment key={mod.module_key}>
                        {/* Module Section Divider Header Row */}
                        <tr className={`${meta.bg} border-t-2 border-b border-slate-200`}>
                          <td colSpan={1 + roles.length} className="py-3 px-5">
                            <div className="flex items-center justify-between">
                              <div
                                onClick={() => toggleCollapse(mod.module_key)}
                                className="flex items-center gap-2.5 cursor-pointer select-none"
                              >
                                <span className="p-1.5 rounded-lg bg-white shadow-xs border border-slate-200">
                                  {meta.icon}
                                </span>
                                <div>
                                  <h4 className={`text-xs font-extrabold ${meta.text} flex items-center gap-2`}>
                                    <span>{mod.module_name}</span>
                                    <span className="text-[11px] font-normal text-slate-500">
                                      ({mod.actions.length} hành động)
                                    </span>
                                  </h4>
                                  <p className="text-[11px] text-slate-500 font-normal">{mod.description}</p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => toggleCollapse(mod.module_key)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white/80 transition-colors"
                                title={isCollapsed ? 'Mở rộng' : 'Thu gọn'}
                              >
                                {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Module Actions Rows */}
                        {!isCollapsed &&
                          mod.actions.map((action, aIdx) => (
                            <tr
                              key={action.key}
                              className={`hover:bg-orange-50/30 transition-colors ${
                                aIdx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                              }`}
                            >
                              {/* Left: Permission Info */}
                              <td className="py-3.5 px-5">
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900 text-xs">{action.label}</span>
                                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                      {action.key}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{action.description}</p>
                                </div>
                              </td>

                              {/* Right: Checkbox columns per role */}
                              {roles.map((r) => {
                                const rolePerms = matrix[r.code] || [];
                                const isChecked = rolePerms.includes(action.key);
                                const isSuperAdmin = r.code === 'SUPER_ADMIN';

                                return (
                                  <td
                                    key={r.code}
                                    onClick={() => togglePermission(r.code, action.key)}
                                    className={`py-3.5 px-4 text-center cursor-pointer border-l border-slate-100 transition-colors ${
                                      isChecked ? 'bg-orange-50/20' : ''
                                    } hover:bg-orange-100/50`}
                                  >
                                    <div className="flex items-center justify-center">
                                      <div
                                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                                          isChecked
                                            ? isSuperAdmin
                                              ? 'bg-purple-600 text-white shadow-xs'
                                              : r.code === 'ADMIN'
                                              ? 'bg-brand-600 text-white shadow-xs'
                                              : r.code === 'DEVELOPER'
                                              ? 'bg-sky-600 text-white shadow-xs'
                                              : 'bg-emerald-600 text-white shadow-xs'
                                            : 'border border-slate-300 bg-white hover:border-brand-500'
                                        }`}
                                      >
                                        {isChecked && <Check size={14} strokeWidth={3} />}
                                      </div>
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Sticky Matrix Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
              <span>Bấm trực tiếp vào các ô checkbox để bật/tắt quyền cho từng vai trò tương ứng.</span>
            </div>

            <Button
              variant="primary"
              size="md"
              leftIcon={<Save size={15} />}
              onClick={saveAllMatrix}
              isLoading={isSaving}
            >
              Lưu toàn bộ ma trận phân quyền
            </Button>
          </div>
        </Card>
      )}

      {/* 6. VIEW MODE B: XEM CHI TIẾT TỪNG VAI TRÒ (SINGLE ROLE DETAIL VIEW) */}
      {viewMode === 'detail' && (
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
                onClick={resetDefaults}
                disabled={isSaving}
              >
                Đặt lại
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Save size={14} />}
                onClick={() => saveRolePermissions(activeRoleCode)}
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
                      onClick={() => toggleModulePermissions(activeRoleCode, actionKeys, !isAllSelected)}
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
                          onClick={() => togglePermission(activeRoleCode, action.key)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                            isChecked
                              ? 'border-brand-500/60 bg-orange-50/40 shadow-xs ring-1 ring-brand-500/20'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <Checkbox
                            checked={isChecked}
                            onChange={() => togglePermission(activeRoleCode, action.key)}
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
              onClick={() => saveRolePermissions(activeRoleCode)}
              isLoading={isSaving}
            >
              Lưu thay đổi vai trò
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
export default PermissionsPage;
