import React, { useState, useMemo } from 'react';
import {
  Shield,
  Plus,
  Search,
  Trash2,
  Power,
  Mail,
  Building2,
  Calendar,
  Edit3,
  KeyRound,
  Crown,
} from 'lucide-react';
import { Table, type Column } from '../../../core/components/Table';
import { Button } from '../../../core/components/Button/Button';
import { Badge } from '../../../core/components/Badge/Badge';
import { Select } from '../../../core/components/Select';
import { alert } from '../../../core/alert';
import { useAuth } from '../../../core/hooks/useAuth';
import { useAccounts } from '../hooks/useAccounts';
import { AccountStatsCards } from '../components/AccountStatsCards';
import { CreateAccountModal } from '../components/CreateAccountModal';
import { EditAccountModal } from '../components/EditAccountModal';
import { ChangePasswordModal } from '../components/ChangePasswordModal';
import { ChangeRoleModal } from '../components/ChangeRoleModal';
import type { UserAccountItem, UserRole, UpdateUserData } from '../types';

export const AccountsPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const {
    users,
    stats,
    isLoading,
    createAccount,
    updateAccount,
    changePassword,
    updateRole,
    toggleStatus,
    deleteAccount,
  } = useAccounts();

  // Permissions check
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isAdmin = currentUser?.role === 'ADMIN' || isSuperAdmin;

  // Filter state
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAccountItem | null>(null);

  // Filtered accounts
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const s = search.toLowerCase().trim();
      const matchSearch =
        !s ||
        u.full_name.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s) ||
        u.company_name.toLowerCase().includes(s);

      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && u.is_active) ||
        (statusFilter === 'inactive' && !u.is_active);

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  // Open Modals
  const handleOpenEditModal = (user: UserAccountItem) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleOpenPasswordModal = (user: UserAccountItem) => {
    setSelectedUser(user);
    setIsPasswordModalOpen(true);
  };

  const handleOpenRoleModal = (user: UserAccountItem) => {
    setSelectedUser(user);
    setIsRoleModalOpen(true);
  };

  // Toggle Status
  const handleToggleStatus = async (user: UserAccountItem) => {
    if (user.email === 'admin@mintforge.vn') {
      alert.toast('Không thể vô hiệu hóa tài khoản Super Admin gốc!', 'error');
      return;
    }

    const action = user.is_active ? 'vô hiệu hóa' : 'kích hoạt lại';
    const confirmed = await alert.confirm({
      title: `Xác nhận ${action} tài khoản?`,
      text: `Tài khoản ${user.email} sẽ ${user.is_active ? 'bị chặn đăng nhập và sử dụng API' : 'được phép truy cập lại hệ thống'}.`,
      confirmButtonText: `Đồng ý ${action}`,
      cancelButtonText: 'Hủy bỏ',
    });

    if (confirmed) {
      await toggleStatus(user.id, !user.is_active);
    }
  };

  // Handle Delete
  const handleDeleteUser = async (user: UserAccountItem) => {
    if (user.email === 'admin@mintforge.vn') {
      alert.toast('Không thể xóa tài khoản Super Admin gốc của hệ thống!', 'error');
      return;
    }
    await deleteAccount(user.id, user.email);
  };

  // Table Columns Definition
  const columns: Column<UserAccountItem>[] = [
    {
      key: 'user',
      title: 'Tài Khoản Nhân Sự',
      render: (_, record) => {
        const initials = record.full_name
          .split(' ')
          .map((n) => n[0])
          .slice(-2)
          .join('')
          .toUpperCase() || 'MF';

        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-600 to-amber-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm border border-white">
              {record.avatar_url ? (
                <img src={record.avatar_url} alt={record.full_name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-slate-800 text-xs flex items-center gap-1.5 truncate">
                <span>{record.full_name}</span>
                {record.email === 'admin@mintforge.vn' && (
                  <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                    <Crown size={10} /> Root
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                <Mail size={11} className="text-slate-400 shrink-0" />
                <span>{record.email}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'role',
      title: 'Vai Trò (Role)',
      dataIndex: 'role',
      sortable: true,
      render: (val) => {
        switch (val) {
          case 'SUPER_ADMIN':
            return <Badge variant="purple">Super Admin</Badge>;
          case 'ADMIN':
            return <Badge variant="brand">Admin</Badge>;
          case 'DEVELOPER':
            return <Badge variant="info">Developer</Badge>;
          case 'MEMBER':
          default:
            return <Badge variant="success">Member</Badge>;
        }
      },
    },
    {
      key: 'company_name',
      title: 'Đơn Vị / Công Ty',
      dataIndex: 'company_name',
      render: (val) => (
        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
          <Building2 size={13} className="text-slate-400 shrink-0" />
          <span className="truncate max-w-[180px]">{val}</span>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Trạng Thái',
      dataIndex: 'is_active',
      sortable: true,
      render: (isActive) =>
        isActive ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Đang hoạt động
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Đã tạm khóa
          </span>
        ),
    },
    {
      key: 'created_at',
      title: 'Ngày Tạo',
      dataIndex: 'created_at',
      sortable: true,
      render: (val) => (
        <div className="flex items-center gap-1 text-slate-500">
          <Calendar size={12} className="text-slate-400" />
          <span>{val ? new Date(val).toLocaleDateString('vi-VN') : '12/09/2026'}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      title: 'Thao Tác Quản Trị',
      align: 'right',
      render: (_, record) => {
        // Super Admin can do everything on all users
        // Admin can manage non-superadmin users
        // Regular users can only edit or change password for self
        const isTargetSuperAdmin = record.role === 'SUPER_ADMIN';
        const canManageThisUser = isSuperAdmin || (!isTargetSuperAdmin && isAdmin) || record.id === currentUser?.id;
        const canDeleteThisUser = (isSuperAdmin || (!isTargetSuperAdmin && isAdmin)) && record.email !== 'admin@mintforge.vn';

        return (
          <div className="flex items-center justify-end gap-1">
            {/* 1. Sửa Thông Tin User */}
            {canManageThisUser && (
              <button
                type="button"
                onClick={() => handleOpenEditModal(record)}
                className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                title="Chỉnh sửa thông tin tài khoản"
              >
                <Edit3 size={14} />
              </button>
            )}

            {/* 2. Đổi Mật Khẩu User */}
            {canManageThisUser && (
              <button
                type="button"
                onClick={() => handleOpenPasswordModal(record)}
                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                title="Đổi mật khẩu người dùng"
              >
                <KeyRound size={14} />
              </button>
            )}

            {/* 3. Phân Quyền Vai Trò */}
            {(isSuperAdmin || (isAdmin && !isTargetSuperAdmin)) && (
              <button
                type="button"
                onClick={() => handleOpenRoleModal(record)}
                className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                title="Đổi vai trò phân quyền"
              >
                <Shield size={14} />
              </button>
            )}

            {/* 4. Khóa / Kích Hoạt */}
            {(isSuperAdmin || (isAdmin && !isTargetSuperAdmin)) && record.email !== 'admin@mintforge.vn' && (
              <button
                type="button"
                onClick={() => handleToggleStatus(record)}
                className={`p-1.5 rounded-lg transition-colors ${
                  record.is_active
                    ? 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                    : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                }`}
                title={record.is_active ? 'Tạm khóa tài khoản' : 'Kích hoạt tài khoản'}
              >
                <Power size={14} />
              </button>
            )}

            {/* 5. Xóa Tài Khoản */}
            {canDeleteThisUser && (
              <button
                type="button"
                onClick={() => handleDeleteUser(record)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Xóa tài khoản vĩnh viễn"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Quản Lý Tài Khoản Nhân Sự</h1>
            <span className="text-xs bg-brand-50 text-brand-600 px-2.5 py-0.5 rounded-full font-bold border border-brand-200">
              RBAC v2.4
            </span>
            {isSuperAdmin && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full font-bold border border-purple-200 flex items-center gap-1 shadow-2xs">
                <Crown size={12} /> Toàn quyền Super Admin (Quản trị tất cả)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quản trị nhân sự toàn diện: Thêm, sửa thông tin, đổi mật khẩu và phân cấp vai trò cho từng User.
          </p>
        </div>

        {isAdmin && (
          <Button variant="primary" size="md" leftIcon={<Plus size={16} />} onClick={() => setIsCreateModalOpen(true)}>
            Thêm tài khoản mới
          </Button>
        )}
      </div>

      {/* 4 Stats Cards */}
      <AccountStatsCards stats={stats} totalUsers={users.length} />

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm theo họ tên, email hoặc tên công ty..."
            className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 shadow-sm transition-all"
          />
        </div>

        <div className="w-full sm:w-52">
          <Select
            value={roleFilter}
            onChange={(v) => setRoleFilter(String(v))}
            size="md"
            options={[
              { label: 'Tất cả vai trò', value: 'all' },
              { label: 'Super Admin', value: 'SUPER_ADMIN' },
              { label: 'Admin', value: 'ADMIN' },
              { label: 'Developer', value: 'DEVELOPER' },
              { label: 'Member', value: 'MEMBER' },
            ]}
          />
        </div>

        <div className="w-full sm:w-48">
          <Select
            value={statusFilter}
            onChange={(v) => setStatusFilter(String(v))}
            size="md"
            options={[
              { label: 'Tất cả trạng thái', value: 'all' },
              { label: 'Đang hoạt động', value: 'active' },
              { label: 'Đã tạm khóa', value: 'inactive' },
            ]}
          />
        </div>
      </div>

      {/* Accounts Table */}
      <Table<UserAccountItem>
        columns={columns}
        data={filteredUsers}
        loading={isLoading}
        emptyText="Không tìm thấy tài khoản nhân sự nào phù hợp với bộ lọc"
        pagination={{ pageSize: 8, pageSizeOptions: [8, 16, 25] }}
      />

      {/* 1. Modal: Thêm Tài Khoản Mới */}
      <CreateAccountModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={createAccount}
      />

      {/* 2. Modal: Sửa Thông Tin Tài Khoản */}
      <EditAccountModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        isSuperAdmin={isSuperAdmin}
        onSave={(userId: string, data: UpdateUserData) => updateAccount(userId, data)}
      />

      {/* 3. Modal: Đổi Mật Khẩu Từng User */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => {
          setIsPasswordModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onSave={(userId: string, newPass: string) => changePassword(userId, newPass)}
      />

      {/* 4. Modal: Đổi Vai Trò Phân Quyền */}
      <ChangeRoleModal
        isOpen={isRoleModalOpen}
        onClose={() => {
          setIsRoleModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onSave={(userId: string, role: UserRole) => updateRole(userId, role)}
      />
    </div>
  );
};
export default AccountsPage;
