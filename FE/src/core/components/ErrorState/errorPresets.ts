import {
  FileQuestion,
  ShieldAlert,
  ServerCrash,
  Wrench,
  WifiOff,
  Inbox,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react';
import type { ErrorCode, ErrorPreset } from './ErrorState.types';

export const ERROR_PRESETS: Record<ErrorCode, ErrorPreset> = {
  '404': {
    badge: '404 • NOT FOUND',
    title: 'Không tìm thấy trang yêu cầu',
    description: 'Đường dẫn bạn vừa truy cập không tồn tại, đã bị đổi tên hoặc tạm thời không khả dụng.',
    defaultActionText: 'Về trang tổng quan',
  },
  '403': {
    badge: '403 • FORBIDDEN',
    title: 'Truy cập bị từ chối',
    description: 'Tài khoản của bạn không đủ đặc quyền quản trị để xem hoặc thao tác trên phân vùng dữ liệu này.',
    defaultActionText: 'Yêu cầu quyền truy cập',
  },
  '500': {
    badge: '500 • SERVER ERROR',
    title: 'Máy chủ gặp sự cố xử lý',
    description: 'Đã xảy ra sự cố không mong muốn tại hệ thống. Đội ngũ kỹ thuật đã được thông báo để khắc phục.',
    defaultActionText: 'Thử tải lại trang',
  },
  '503': {
    badge: '503 • MAINTENANCE',
    title: 'Hệ thống đang bảo trì',
    description: 'Hệ thống đang được nâng cấp định kỳ nhằm tối ưu hóa hiệu năng. Vui lòng quay lại sau ít phút.',
    defaultActionText: 'Kiểm tra trạng thái',
  },
  'network': {
    badge: 'OFFLINE • NETWORK ERROR',
    title: 'Mất kết nối mạng Internet',
    description: 'Không thể kết nối đến máy chủ API. Vui lòng kiểm tra lại đường truyền Internet của bạn.',
    defaultActionText: 'Thử kết nối lại',
  },
  'empty': {
    badge: 'EMPTY • NO DATA',
    title: 'Không có dữ liệu',
    description: 'Chưa có thông tin hoặc dữ liệu hiển thị trong danh mục này.',
    defaultActionText: 'Thêm mới ngay',
  },
  'custom': {
    badge: 'ERROR',
    title: 'Đã xảy ra lỗi',
    description: 'Hệ thống ghi nhận sự cố bất thường.',
    defaultActionText: 'Quay lại',
  },
};

export const ERROR_ICONS: Record<ErrorCode, LucideIcon> = {
  '404': FileQuestion,
  '403': ShieldAlert,
  '500': ServerCrash,
  '503': Wrench,
  'network': WifiOff,
  'empty': Inbox,
  'custom': AlertCircle,
};