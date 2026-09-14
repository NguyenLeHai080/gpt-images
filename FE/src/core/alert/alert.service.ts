import { CustomSwal, ToastSwal } from './sweetAlert.instance';
import type { AlertOptions, ConfirmOptions, ToastOptions } from './alert.types';

export const alertService = {
  /**
   * Hiển thị thông báo thành công
   */
  success(title: string, text?: string, options?: AlertOptions) {
    return CustomSwal.fire({
      icon: 'success',
      title,
      text,
      confirmButtonText: options?.confirmButtonText || 'Đồng ý',
      ...options,
    });
  },

  /**
   * Hiển thị thông báo lỗi
   */
  error(title: string, text?: string, options?: AlertOptions) {
    return CustomSwal.fire({
      icon: 'error',
      title,
      text: text || 'Đã xảy ra lỗi trong quá trình xử lý.',
      confirmButtonText: options?.confirmButtonText || 'Đóng',
      ...options,
    });
  },

  /**
   * Hiển thị cảnh báo
   */
  warning(title: string, text?: string, options?: AlertOptions) {
    return CustomSwal.fire({
      icon: 'warning',
      title,
      text,
      confirmButtonText: options?.confirmButtonText || 'Tôi hiểu',
      ...options,
    });
  },

  /**
   * Hiển thị thông tin
   */
  info(title: string, text?: string, options?: AlertOptions) {
    return CustomSwal.fire({
      icon: 'info',
      title,
      text,
      confirmButtonText: options?.confirmButtonText || 'OK',
      ...options,
    });
  },

  /**
   * Hiển thị Toast thông báo nhanh góc màn hình
   */
  toast(title: string, icon: ToastOptions['icon'] = 'success', options?: Partial<ToastOptions>) {
    return ToastSwal.fire({
      icon,
      title,
      position: options?.position || 'top-end',
      timer: options?.timer || 3000,
      ...options,
    });
  },

  /**
   * Hiển thị hộp thoại xác nhận hành động (trả về boolean)
   */
  async confirm(options: ConfirmOptions): Promise<boolean> {
    const result = await CustomSwal.fire({
      icon: options.icon || 'warning',
      title: options.title,
      text: options.text,
      html: options.html,
      showCancelButton: true,
      confirmButtonText: options.confirmButtonText || 'Xác nhận',
      cancelButtonText: options.cancelButtonText || 'Hủy bỏ',
      customClass: {
        popup: 'mf-swal-popup',
        title: 'mf-swal-title',
        htmlContainer: 'mf-swal-html',
        actions: 'mf-swal-actions',
        confirmButton: options.isDanger ? 'mf-swal-danger-btn' : 'mf-swal-confirm-btn',
        cancelButton: 'mf-swal-cancel-btn',
      },
    });

    return result.isConfirmed;
  },

  /**
   * Hiển thị spinner loading chờ xử lý
   */
  loading(title = 'Đang xử lý...', text = 'Vui lòng chờ trong giây lát') {
    CustomSwal.fire({
      title,
      text,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        CustomSwal.showLoading();
      },
    });
  },

  /**
   * Đóng alert đang mở
   */
  close() {
    CustomSwal.close();
  },
};

// Shorthand export
export const alert = alertService;
