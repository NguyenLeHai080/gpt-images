import React, { createContext, useContext, useState } from 'react';
import type { User } from '../types';
import { apiClient } from '../api/client';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string, linkApiKey?: boolean) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const token = localStorage.getItem('mf_access_token');
    const stored = localStorage.getItem('mf_user');
    if (token && stored) {
      try {
        return JSON.parse(stored);
      } catch {
        localStorage.removeItem('mf_access_token');
        localStorage.removeItem('mf_user');
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password?: string, linkApiKey: boolean = false): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await apiClient.post<any>('/auth/login', {
        email: email.trim(),
        password: password || '',
        link_api_key: linkApiKey,
      });

      if (res.success && res.data) {
        localStorage.setItem('mf_access_token', res.data.access_token);
        localStorage.setItem('mf_user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        return true;
      }
      throw new Error(res.message || 'Đăng nhập không thành công');
    } catch (err: any) {
      console.warn('[useAuth] Đăng nhập thất bại:', err?.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('mf_access_token');
    localStorage.removeItem('mf_user');
    setUser(null);
    window.location.href = '/auth/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};