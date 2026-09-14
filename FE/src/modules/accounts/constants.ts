import type { UserRole } from './types';

export interface RoleOption {
  label: string;
  value: UserRole;
  description: string;
  badgeVariant: 'purple' | 'brand' | 'info' | 'success';
}

export const ROLE_OPTIONS: RoleOption[] = [
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
