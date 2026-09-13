import React, { useState, useMemo } from 'react';
import {
  Users,
  Shield,
  Code2,
  CheckCircle2,
  Plus,
  Search,
  Trash2,
  Power,
  ShieldCheck,
  Mail,
  Building2,
  Lock,
  Calendar,
  UserCheck,
} from 'lucide-react';
import { Table, type Column } from '../../../core/components/Table';
import { Button } from '../../../core/components/Button/Button';
import { Badge } from '../../../core/components/Badge/Badge';
import { Select } from '../../../core/components/Select';
import { Modal } from '../../../core/components/Modal';
import { Input } from '../../../core/components/Input/Input';
import { Card } from '../../../core/components/Card/Card';
import { alert } from '../../../core/alert';
import { useAccounts } from '../hooks/useAccounts';
import type { UserAccountItem, UserRole, CreateUserData } from '../types';

const ROLE_OPTIONS: { label: string; value: UserRole; description: string; badgeVariant: 'purple' | 'brand' | 'info' | 'success' }[] = [
  {
    label: 'Super Admin',
    value: 'SUPER_ADMIN',
    description: 'Toàn quyền kiểm soát tài khoản, tài chính, API Keys và chính sách bảo mật hệ thống.',
    badgeVariant: 'purple',
  },
  {
    label: 'Admin (Quản trị)',
    value: 'ADMIN',
    description: 'Quản lý nhân sự, API keys, ví doanh nghiệp và theo dõi Audit Logs.',
    badgeVariant: 'brand',
  },
  {
    label: 'Developer (Kỹ sư)',
    value: 'DEVELOPER',
    description: 'Cấp phát API Keys, kiểm thử mô hình AI Studio và tích hợp hệ sinh thái kỹ thuật.',
    badgeVariant: 'info',
  },
  {
    label: 'Member (Thành viên)',
    value: 'MEMBER',
    description: 'Sử dụng dịch vụ tạo ảnh AI cơ bản, xem thư viện tác phẩm và số dư cá nhân.',
    badgeVariant: 'success',
  },
];

export const AccountsPage: React.FC = () => {
  const { users, stats, isLoading, createAccount, updateRole, toggleStatus, deleteAccount } = useAccounts();

  // Filter state
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAccountItem | null>(null);
  const [targetRole, setTargetRole] = useState<UserRole>('MEMBER');

  // Create Form state
  const [formData, setFormData] = useState<CreateUserData>({
    full_name: '',
    email: '',
    password: '',
    role: 'MEMBER',
    company_name: 'MintForge Business Suite',
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Open Edit Role Modal
  const handleOpenRoleModal = (user: UserAccountItem) => {
    setSelectedUser(user);
    setTargetRole(user.role);
    setIsRoleModalOpen(true);
  };

  // Submit Role Change
  const handleSaveRole = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    const success = await updateRole(selectedUser.id, targetRole);
    setIsSubmitting(false);
    if (success) {
      setIsRoleModalOpen(false);
      setSelectedUser(null);
    }
  };

  // Toggle Status
  const handleToggleStatus = async (user: UserAccountItem) => {
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

  // Form Validation & Submit Create
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.full_name.trim()) errors.full_name = 'Vui lòng nhập họ và tên';
    if (!formData.email.trim()) {
      errors.email = 'Vui lòng nhập địa chỉ email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Email không hợp lệ';
    }
    if (!formData.password || formData.password.length < 6) {
      errors.password = 'Mật khẩu phải từ 6 ký tự trở lên';
    }
    if (!formData.company_name.trim()) errors.company_name = 'Vui lòng nhập tên công ty / phòng ban';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    const success = await createAccount(formData);
    setIsSubmitting(false);

    if (success) {
      setIsCreateModalOpen(false);
      setFormData({
        full_name: '',
        email: '',
        password: '',
        role: 'MEMBER',
        company_name: 'MintForge Business Suite',
        is_active: true,
      });
      setFormErrors({});
    }
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
                  <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-bold">
                    Root
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
      title: 'Thao Tác',
      align: 'right',
      render: (_, record) => (
        <div className="flex items-center justify-end gap-1.5">
          {/* Change Role */}
          <button
            type="button"
            onClick={() => handleOpenRoleModal(record)}
            className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
            title="Đổi vai trò phân quyền"
          >
            <Shield size={14} />
          </button>

          {/* Toggle Active Status */}
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

          {/* Delete User */}
          {record.email !== 'admin@mintforge.vn' && (
            <button
              type="button"
              onClick={() => handleDeleteUser(record)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Xóa tài khoản"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Quản Lý Tài Khoản Nhân Sự</h1>
            <span className="text-xs bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full font-bold border border-brand-200">
              RBAC v2.4
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quản trị danh sách nhân sự, phân cấp vai trò và kiểm soát trạng thái hoạt động toàn doanh nghiệp.
          </p>
        </div>
        <Button variant="primary" size="md" leftIcon={<Plus size={16} />} onClick={() => setIsCreateModalOpen(true)}>
          Thêm tài khoản mới
        </Button>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md" className="border-l-4 border-l-brand-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng số tài khoản</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{stats?.total_users ?? users.length}</h3>
              <p className="text-[11px] text-slate-400 mt-1">Toàn bộ nhân sự & đối tác</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-orange-50 text-brand-600 flex items-center justify-center shrink-0">
              <Users size={20} />
            </div>
          </div>
        </Card>

        <Card padding="md" className="border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quản trị viên</p>
              <h3 className="text-2xl font-extrabold text-purple-700 mt-1">
                {(stats?.super_admins ?? 0) + (stats?.admins ?? 0)}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                {stats?.super_admins ?? 0} Super Admin, {stats?.admins ?? 0} Admin
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} />
            </div>
          </div>
        </Card>

        <Card padding="md" className="border-l-4 border-l-sky-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kỹ sư AI / Dev</p>
              <h3 className="text-2xl font-extrabold text-sky-700 mt-1">{stats?.developers ?? 0}</h3>
              <p className="text-[11px] text-slate-400 mt-1">Quyền tạo & quản trị API Keys</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <Code2 size={20} />
            </div>
          </div>
        </Card>

        <Card padding="md" className="border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Đang hoạt động</p>
              <h3 className="text-2xl font-extrabold text-emerald-700 mt-1">{stats?.active_users ?? 0}</h3>
              <p className="text-[11px] text-slate-400 mt-1">
                {stats?.inactive_users ?? 0} tài khoản tạm khóa
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={20} />
            </div>
          </div>
        </Card>
      </div>

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

      {/* Modal: Thêm Tài Khoản Mới */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => !isSubmitting && setIsCreateModalOpen(false)}
        title="Thêm Tài Khoản Nhân Sự Mới"
        description="Khởi tạo tài khoản, phân vai trò và cấp quyền truy cập vào MintForge Business Suite."
        size="lg"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setIsCreateModalOpen(false)} disabled={isSubmitting}>
              Hủy bỏ
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              leftIcon={<UserCheck size={15} />}
              onClick={handleCreateSubmit}
            >
              Tạo tài khoản
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Họ và tên *"
              placeholder="VD: Nguyễn Văn An"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              error={formErrors.full_name}
            />

            <Input
              label="Địa chỉ Email *"
              type="email"
              placeholder="VD: user@mintforge.vn"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={formErrors.email}
              leftIcon={<Mail size={14} className="text-slate-400" />}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Mật khẩu khởi tạo *"
              type="password"
              placeholder="Tối thiểu 6 ký tự"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={formErrors.password}
              leftIcon={<Lock size={14} className="text-slate-400" />}
            />

            <Input
              label="Công ty / Phòng ban *"
              placeholder="VD: MintForge AI Lab"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              error={formErrors.company_name}
              leftIcon={<Building2 size={14} className="text-slate-400" />}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Phân Cấp Vai Trò (Role) *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ROLE_OPTIONS.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => setFormData({ ...formData, role: opt.value })}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    formData.role === opt.value
                      ? 'border-brand-500 bg-orange-50/50 ring-2 ring-brand-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-800">{opt.label}</span>
                    <Badge variant={opt.badgeVariant} size="sm">
                      {opt.value}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{opt.description}</p>
                </div>
              ))}
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal: Đổi Vai Trò Phân Quyền */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => !isSubmitting && setIsRoleModalOpen(false)}
        title="Cập Nhật Phân Cấp Vai Trò"
        description={`Thay đổi vai trò và quyền hạn quản trị cho tài khoản: ${selectedUser?.email || ''}`}
        size="md"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setIsRoleModalOpen(false)} disabled={isSubmitting}>
              Hủy bỏ
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              leftIcon={<ShieldCheck size={15} />}
              onClick={handleSaveRole}
            >
              Lưu thay đổi vai trò
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {ROLE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              onClick={() => setTargetRole(opt.value)}
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                targetRole === opt.value
                  ? 'border-brand-500 bg-orange-50/50 ring-2 ring-brand-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <input
                type="radio"
                name="user-role"
                checked={targetRole === opt.value}
                onChange={() => setTargetRole(opt.value)}
                className="mt-1 text-brand-600 focus:ring-brand-500"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{opt.label}</span>
                  <Badge variant={opt.badgeVariant}>{opt.value}</Badge>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{opt.description}</p>
              </div>
            </label>
          ))}
        </div>
      </Modal>
    </div>
  );
};
export default AccountsPage;
