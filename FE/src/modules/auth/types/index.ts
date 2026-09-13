export interface LoginCredentials {
  email: string;
  password?: string;
  linkApiKey?: boolean;
  rememberMe?: boolean;
}

export interface AuthState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
}
