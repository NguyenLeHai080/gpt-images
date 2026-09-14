export interface RoleInfo {
  code: string;
  name: string;
  description: string;
  badge_color: 'purple' | 'brand' | 'blue' | 'emerald' | string;
  user_count: number;
  is_system: boolean;
}

export interface PermissionAction {
  key: string;
  label: string;
  description: string;
}

export interface PermissionGroup {
  module_key: string;
  module_name: string;
  description: string;
  actions: PermissionAction[];
}

export interface PermissionsMatrixData {
  roles: RoleInfo[];
  modules: PermissionGroup[];
  matrix: Record<string, string[]>;
}
