/**
 * Tiện ích định dạng ngày giờ chuẩn Việt Nam (UTC+7 / Asia/Ho_Chi_Minh)
 * Đảm bảo tự động chuyển đổi chuỗi UTC naive từ máy chủ thành đúng giờ địa phương Việt Nam.
 */
export function formatDateTimeVN(val: string | Date | undefined | null): string {
  if (!val) return '-';
  let str = String(val).trim();
  
  // Nếu là chuỗi ISO nhưng thiếu timezone (không có Z và không có offset +/-)
  if (str.includes('T') && !str.endsWith('Z') && !/[+-]\d{2}(:\d{2})?$/.test(str)) {
    str += 'Z';
  } else if (!str.includes('T') && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(str)) {
    // Định dạng kiểu "2026-09-14 12:38:23"
    str = str.replace(' ', 'T') + 'Z';
  }

  const d = new Date(str);
  if (isNaN(d.getTime())) return String(val);

  return d.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour12: false,
  });
}

/**
 * Định dạng thời lượng xử lý (latency ms sang giây)
 */
export function formatDuration(ms: number | undefined | null): string {
  if (ms == null || ms <= 0) return '-';
  return `${(ms / 1000).toFixed(1)}s`;
}
