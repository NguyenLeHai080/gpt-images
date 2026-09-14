import {
  Users,
  KeyRound,
  ShieldCheck,
  Wallet,
  Building2,
  Sliders,
  ArrowDownToLine,
  Package,
  Receipt,
  Wrench,
  Layers,
  Sparkles,
  TrendingUp,
  BookOpen,
  type LucideIcon,
} from 'lucide-react';

export interface NavItemConfig {
  id: string;
  label: string;
  path: string;
  icon?: LucideIcon;
  isPill?: boolean;
  requiredRoles?: ('SUPER_ADMIN' | 'ADMIN' | 'DEVELOPER' | 'MEMBER')[];
  badge?: string;
  badgeVariant?: 'brand' | 'purple' | 'info' | 'warning' | 'success';
  disabled?: boolean;
  disabledReason?: string;
}

export interface NavGroupConfig {
  header: string;
  subHeader?: string;
  items: NavItemConfig[];
}

export const SIDEBAR_NAV_GROUPS: NavGroupConfig[] = [
  {
    header: 'KHÔNG GIAN LÀM VIỆC',
    subHeader: 'TỔNG QUAN',
    items: [
      { id: 'overview', label: 'Tổng quan hệ thống', path: '/app/overview', isPill: true },
    ],
  },
  {
    header: 'CỔNG AI GENERATOR (gpt-image-2)',
    items: [
      { id: 'studio', label: 'Studio Tạo ảnh AI', path: '/app/studio', icon: Sparkles },
      { id: 'jobs', label: 'Quản lý Jobs & Nhật ký', path: '/app/jobs', icon: Layers },
    ],
  },
  {
    header: 'TÀI KHOẢN & TRUY CẬP',
    items: [
      { id: 'accounts', label: 'Tài khoản', path: '/app/accounts', icon: Users, requiredRoles: ['SUPER_ADMIN', 'ADMIN'] },
      { id: 'api-keys', label: 'API Keys Cổng khách', path: '/app/api-keys', icon: KeyRound },
      { id: 'api-docs', label: 'Tài liệu API (Docs)', path: '/app/api-docs', icon: BookOpen, badge: 'v1.0', badgeVariant: 'brand' },
      { id: 'permissions', label: 'Phân quyền', path: '/app/permissions', icon: ShieldCheck, requiredRoles: ['SUPER_ADMIN', 'ADMIN'] },
    ],
  },
  {
    header: 'CREDIT & THANH TOÁN',
    items: [
      { id: 'wallet', label: 'Ví & Dòng tiền', path: '/app/billing', icon: Wallet },
      { id: 'pnl', label: 'Báo cáo Dòng tiền & PnL', path: '/app/pnl', icon: TrendingUp, requiredRoles: ['SUPER_ADMIN', 'ADMIN'] },
      { id: 'sepay', label: 'Giao dịch nạp SePay', path: '/app/sepay', icon: ArrowDownToLine },
      { id: 'banking', label: 'Ngân hàng & QR', path: '/app/banking', icon: Building2 },
      { id: 'credit-config', label: 'Cấu hình Credit', path: '/app/credit-config', icon: Sliders, requiredRoles: ['SUPER_ADMIN', 'ADMIN'] },
    ],

  },
  {
    header: 'CẤU HÌNH DỊCH VỤ',
    items: [
      {
        id: 'packages',
        label: 'Cấu hình gói',
        path: '/app/packages',
        icon: Package,
        disabled: true,
        badge: 'Đang phát triển',
        badgeVariant: 'warning',
        disabledReason: 'Chức năng đang được phát triển',
      },
      {
        id: 'pricing',
        label: 'Bảng giá model',
        path: '/app/pricing',
        icon: Receipt,
      },
      {
        id: 'tools',
        label: 'Cài đặt công cụ',
        path: '/app/tools',
        icon: Wrench,
        disabled: true,
        badge: 'Đang phát triển',
        badgeVariant: 'warning',
        disabledReason: 'Chức năng đang được phát triển',
      },
    ],
  },
];