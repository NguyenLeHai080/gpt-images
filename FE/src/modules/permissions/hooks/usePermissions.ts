import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../../core/api/client';
import { alert } from '../../../core/alert';
import type { PermissionsMatrixData, RoleInfo, PermissionGroup } from '../types';

export const usePermissions = () => {
  const [roles, setRoles] = useState<RoleInfo[]>([]);
  const [modules, setModules] = useState<PermissionGroup[]>([]);
  const [matrix, setMatrix] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMatrix = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<PermissionsMatrixData>('/permissions');
      if (res.success && res.data) {
        setRoles(res.data.roles);
        setModules(res.data.modules);
        setMatrix(res.data.matrix);
      } else {
        throw new Error(res.message || 'Không thể tải ma trận phân quyền');
      }
    } catch (err: any) {
      console.error('[usePermissions] Lỗi tải dữ liệu:', err);
      setError(err?.message || 'Lỗi kết nối máy chủ');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatrix();
  }, [fetchMatrix]);

  const togglePermission = (roleCode: string, permissionKey: string) => {
    setMatrix((prev) => {
      const currentList = prev[roleCode] || [];
      const hasPermission = currentList.includes(permissionKey);
      const updatedList = hasPermission
        ? currentList.filter((k) => k !== permissionKey)
        : [...currentList, permissionKey];

      return {
        ...prev,
        [roleCode]: updatedList,
      };
    });
  };

  const toggleModulePermissions = (roleCode: string, moduleKeys: string[], selectAll: boolean) => {
    setMatrix((prev) => {
      const currentList = prev[roleCode] || [];
      let updatedList: string[];
      if (selectAll) {
        const set = new Set([...currentList, ...moduleKeys]);
        updatedList = Array.from(set);
      } else {
        updatedList = currentList.filter((k) => !moduleKeys.includes(k));
      }
      return {
        ...prev,
        [roleCode]: updatedList,
      };
    });
  };

  const saveRolePermissions = async (roleCode: string): Promise<boolean> => {
    setIsSaving(true);
    try {
      const permissions = matrix[roleCode] || [];
      const res = await apiClient.put<Record<string, string[]>>(`/permissions/roles/${roleCode}`, {
        permissions,
      });

      if (res.success) {
        alert.toast(`Đã lưu cấu hình phân quyền cho vai trò "${roleCode}" thành công!`, 'success');
        return true;
      }
      throw new Error(res.message || 'Không thể cập nhật phân quyền');
    } catch (err: any) {
      alert.toast(err?.message || 'Lỗi khi lưu phân quyền', 'error');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const saveAllMatrix = async (): Promise<boolean> => {
    setIsSaving(true);
    try {
      for (const r of roles) {
        const perms = matrix[r.code] || [];
        await apiClient.put(`/permissions/roles/${r.code}`, {
          permissions: perms,
        });
      }
      alert.toast('Đã lưu thành công toàn bộ ma trận phân quyền hệ thống!', 'success');
      return true;
    } catch (err: any) {
      alert.toast(err?.message || 'Lỗi khi lưu ma trận phân quyền', 'error');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const resetDefaults = async (): Promise<boolean> => {
    const confirmed = await alert.confirm({
      title: 'Khôi phục ma trận mặc định?',
      text: 'Toàn bộ tùy biến phân quyền sẽ được thiết lập lại theo tiêu chuẩn bảo mật hệ thống.',
      confirmButtonText: 'Khôi phục ngay',
      cancelButtonText: 'Hủy bỏ',
    });

    if (!confirmed) return false;

    setIsSaving(true);
    try {
      const res = await apiClient.post<Record<string, string[]>>('/permissions/reset-defaults', {});
      if (res.success && res.data) {
        setMatrix(res.data);
        alert.toast('Đã khôi phục ma trận phân quyền về mặc định thành công!', 'success');
        return true;
      }
      throw new Error(res.message || 'Lỗi khôi phục mặc định');
    } catch (err: any) {
      alert.toast(err?.message || 'Không thể khôi phục mặc định', 'error');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    roles,
    modules,
    matrix,
    isLoading,
    isSaving,
    error,
    fetchMatrix,
    togglePermission,
    toggleModulePermissions,
    saveRolePermissions,
    saveAllMatrix,
    resetDefaults,
  };
};
