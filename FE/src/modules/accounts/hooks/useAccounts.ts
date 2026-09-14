import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../../core/api/client';
import { alert } from '../../../core/alert';
import type { UserAccountItem, AccountStats, CreateUserData, UpdateUserData, UserRole } from '../types';

interface AccountsData {
  users: UserAccountItem[];
  stats: AccountStats;
}

export const useAccounts = () => {
  const [users, setUsers] = useState<UserAccountItem[]>([]);
  const [stats, setStats] = useState<AccountStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async (search?: string, role?: string, status?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (role && role !== 'all') params.append('role', role);
      if (status && status !== 'all') params.append('status', status);

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const res = await apiClient.get<AccountsData>(`/accounts${queryString}`);

      if (res.success && res.data) {
        setUsers(res.data.users);
        setStats(res.data.stats);
      } else {
        throw new Error(res.message || 'Không thể tải danh sách tài khoản');
      }
    } catch (err: any) {
      console.error('[useAccounts] Lỗi tải tài khoản:', err);
      setError(err?.message || 'Lỗi kết nối máy chủ');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const createAccount = async (data: CreateUserData): Promise<boolean> => {
    try {
      const res = await apiClient.post<UserAccountItem>('/accounts', data);
      if (res.success && res.data) {
        alert.toast(`Đã tạo tài khoản thành công cho: ${data.email}`, 'success');
        fetchAccounts();
        return true;
      }
      throw new Error(res.message || 'Lỗi khi tạo tài khoản');
    } catch (err: any) {
      alert.toast(err?.message || 'Không thể tạo tài khoản', 'error');
      return false;
    }
  };

  const updateRole = async (userId: string, role: UserRole): Promise<boolean> => {
    try {
      const res = await apiClient.patch<UserAccountItem>(`/accounts/${userId}/role`, { role });
      if (res.success) {
        alert.toast('Cập nhật vai trò người dùng thành công', 'success');
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
        fetchAccounts();
        return true;
      }
      throw new Error(res.message || 'Lỗi cập nhật vai trò');
    } catch (err: any) {
      alert.toast(err?.message || 'Không thể cập nhật vai trò', 'error');
      return false;
    }
  };

  const toggleStatus = async (userId: string, isActive: boolean): Promise<boolean> => {
    try {
      const res = await apiClient.patch<UserAccountItem>(`/accounts/${userId}/status`, { is_active: isActive });
      if (res.success) {
        const actionText = isActive ? 'Kích hoạt' : 'Vô hiệu hóa';
        alert.toast(`${actionText} tài khoản thành công`, 'success');
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_active: isActive } : u)));
        fetchAccounts();
        return true;
      }
      throw new Error(res.message || 'Lỗi đổi trạng thái');
    } catch (err: any) {
      alert.toast(err?.message || 'Không thể đổi trạng thái tài khoản', 'error');
      return false;
    }
  };

  const deleteAccount = async (userId: string, email: string): Promise<boolean> => {
    const confirmed = await alert.confirm({
      title: 'Xác nhận xóa tài khoản?',
      text: `Bạn có chắc muốn xóa vĩnh viễn tài khoản "${email}" khỏi hệ thống?`,
      confirmButtonText: 'Đồng ý xóa',
      cancelButtonText: 'Hủy bỏ',
    });

    if (!confirmed) return false;

    try {
      const res = await apiClient.delete<{ deleted_id: string }>(`/accounts/${userId}`);
      if (res.success) {
        alert.toast('Đã xóa tài khoản thành công', 'success');
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        fetchAccounts();
        return true;
      }
      throw new Error(res.message || 'Không thể xóa tài khoản');
    } catch (err: any) {
      alert.toast(err?.message || 'Lỗi khi xóa tài khoản', 'error');
      return false;
    }
  };

  const updateAccount = async (userId: string, data: UpdateUserData): Promise<boolean> => {
    try {
      const res = await apiClient.put<UserAccountItem>(`/accounts/${userId}`, data);
      if (res.success && res.data) {
        alert.toast('Cập nhật thông tin tài khoản thành công', 'success');
        fetchAccounts();
        return true;
      }
      throw new Error(res.message || 'Lỗi khi cập nhật tài khoản');
    } catch (err: any) {
      alert.toast(err?.message || 'Không thể cập nhật tài khoản', 'error');
      return false;
    }
  };

  const changePassword = async (userId: string, newPassword: string): Promise<boolean> => {
    try {
      const res = await apiClient.post<{ user_id: string }>(`/accounts/${userId}/password`, {
        new_password: newPassword,
      });
      if (res.success) {
        alert.toast('Đổi mật khẩu người dùng thành công', 'success');
        return true;
      }
      throw new Error(res.message || 'Lỗi khi đổi mật khẩu');
    } catch (err: any) {
      alert.toast(err?.message || 'Không thể đổi mật khẩu', 'error');
      return false;
    }
  };

  const updateProviderKey = async (userId: string, providerApiKey: string): Promise<boolean> => {
    try {
      const res = await apiClient.patch(`/accounts/${userId}/provider-key`, {
        provider_api_key: providerApiKey,
      });
      if (res.success) {
        alert.toast('Cập nhật API Key nhà cung cấp (120đ/ảnh) thành công', 'success');
        fetchAccounts();
        return true;
      }
      throw new Error(res.message || 'Lỗi khi cập nhật Provider Key');
    } catch (err: any) {
      alert.toast(err?.message || 'Không thể cập nhật Provider Key', 'error');
      return false;
    }
  };

  return {
    users,
    stats,
    isLoading,
    error,
    fetchAccounts,
    createAccount,
    updateAccount,
    changePassword,
    updateRole,
    toggleStatus,
    deleteAccount,
    updateProviderKey,
  };
};

