import { apiClient } from '../../../core/api/client';
import type { ApiResponse, User } from '../../../core/types';
import type { LoginCredentials } from '../types';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<{ access_token: string; user: User }>> => {
    return await apiClient.post('/auth/login', {
      email: credentials.email,
      password: credentials.password || '12345678',
      link_api_key: credentials.linkApiKey,
      remember_me: credentials.rememberMe,
    });
  },

  getMe: async (): Promise<ApiResponse<User>> => {
    return await apiClient.get('/auth/me');
  },
};
