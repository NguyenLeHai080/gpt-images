import type { ApiResponse } from '../types';
import { alert } from '../alert';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

export interface ApiRequestOptions {
  /**
   * Tự động hiển thị SweetAlert2 khi có lỗi từ server hoặc mạng (mặc định: false để không làm gián đoạn fallback)
   */
  showErrorAlert?: boolean;
  /**
   * Hiển thị SweetAlert2 Toast thành công sau khi gọi API
   */
  successToast?: string;
  /**
   * Header bổ sung
   */
  headers?: Record<string, string>;
}

class ApiClient {
  private getHeaders(extraHeaders?: Record<string, string>): HeadersInit {
    const token = localStorage.getItem('mf_access_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...extraHeaders,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private handleError(error: any, endpoint: string, options?: ApiRequestOptions): never {
    const message = error?.message || 'Đã xảy ra lỗi khi kết nối tới máy chủ.';
    console.warn(`[ApiClient] Lỗi tại ${endpoint}:`, message);

    if (options?.showErrorAlert) {
      alert.error('Lỗi yêu cầu API', message);
    }

    throw error;
  }
  private async processResponse<T>(response: Response, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('mf_access_token');
      }
      const errorData = await response.json().catch(() => null);
      const err: any = new Error(errorData?.message || `HTTP Error ${response.status}`);
      err.status = response.status;
      throw err;
    }

    const data: ApiResponse<T> = await response.json();
    if (options?.successToast) {
      alert.toast(options.successToast, 'success');
    }
    return data;
  }

  async get<T>(endpoint: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders(options?.headers),
      });
      return await this.processResponse<T>(response, options);
    } catch (error: any) {
      return this.handleError(error, `GET ${endpoint}`, options);
    }
  }

  async post<T>(endpoint: string, body: any, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(options?.headers),
        body: JSON.stringify(body),
      });
      return await this.processResponse<T>(response, options);
    } catch (error: any) {
      return this.handleError(error, `POST ${endpoint}`, options);
    }
  }

  async put<T>(endpoint: string, body: any, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(options?.headers),
        body: JSON.stringify(body),
      });
      return await this.processResponse<T>(response, options);
    } catch (error: any) {
      return this.handleError(error, `PUT ${endpoint}`, options);
    }
  }

  async delete<T>(endpoint: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders(options?.headers),
      });
      return await this.processResponse<T>(response, options);
    } catch (error: any) {
      return this.handleError(error, `DELETE ${endpoint}`, options);
    }
  }
}

export const apiClient = new ApiClient();
