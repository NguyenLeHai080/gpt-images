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

const DEFAULT_USER: User = {
  id: 'usr_admin_001',
  email: 'admin@mintforge.vn',
  full_name: 'Admin',
  role: 'SUPER_ADMIN',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  company_name: 'MintForge Business Suite',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('mf_user');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return DEFAULT_USER;
      }
    }
    // Default logged in for easy test or preview, or set to null
    return DEFAULT_USER;
  });
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string = '12345678', linkApiKey: boolean = false): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Call backend API
      const res = await apiClient.post<any>('/auth/login', {
        email,
        password,
        link_api_key: linkApiKey,
      });

      if (res.success && res.data) {
        localStorage.setItem('mf_access_token', res.data.access_token);
        localStorage.setItem('mf_user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        return true;
      }
      return false;
    } catch {
      // Offline fallback: log in mock user
      const loggedUser: User = {
        ...DEFAULT_USER,
        email: email || DEFAULT_USER.email,
      };
      localStorage.setItem('mf_access_token', 'mock-jwt-token-12345');
      localStorage.setItem('mf_user', JSON.stringify(loggedUser));
      setUser(loggedUser);
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('mf_access_token');
    localStorage.removeItem('mf_user');
    setUser(null);
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
