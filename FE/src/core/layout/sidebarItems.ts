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
  type LucideIcon,
} from 'lucide-react';

export interface NavItemConfig {
  id: string;
  label: string;
  path: string;
  icon?: LucideIcon;
  isPill?: boolean;
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
    header: 'TÀI KHOẢN & TRUY CẬP',
    items: [
      { id: 'accounts', label: 'Tài khoản', path: '/app/accounts', icon: Users },
      { id: 'api-keys', label: 'API Keys & gói dịch vụ', path: '/app/api-keys', icon: KeyRound },
      { id: 'permissions', label: 'Phân quyền', path: '/app/permissions', icon: ShieldCheck },
    ],
  },
  {
    header: 'CREDIT & THANH TOÁN',
    items: [
      { id: 'wallet', label: 'Ví & dòng tiền', path: '/app/billing', icon: Wallet },
      { id: 'banking', label: 'Ngân hàng & QR', path: '/app/banking', icon: Building2 },
      { id: 'credit-config', label: 'Cấu hình Credit', path: '/app/credit-config', icon: Sliders },
      { id: 'sepay', label: 'Giao dịch nạp SePay', path: '/app/sepay', icon: ArrowDownToLine },
    ],
  },
  {
    header: 'CẤU HÌNH DỊCH VỤ',
    items: [
      { id: 'packages', label: 'Cấu hình gói', path: '/app/packages', icon: Package },
      { id: 'pricing', label: 'Bảng giá model', path: '/app/pricing', icon: Receipt },
      { id: 'tools', label: 'Cài đặt công cụ', path: '/app/tools', icon: Wrench },
    ],
  },
];