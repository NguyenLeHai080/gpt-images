import type { SweetAlertIcon, SweetAlertPosition } from 'sweetalert2';

export interface AlertOptions {
  title?: string;
  text?: string;
  html?: string;
  icon?: SweetAlertIcon;
  confirmButtonText?: string;
  timer?: number;
}

export interface ConfirmOptions {
  title: string;
  text?: string;
  html?: string;
  icon?: SweetAlertIcon;
  confirmButtonText?: string;
  cancelButtonText?: string;
  isDanger?: boolean;
}

export interface ToastOptions {
  title: string;
  icon?: SweetAlertIcon;
  position?: SweetAlertPosition;
  timer?: number;
}
