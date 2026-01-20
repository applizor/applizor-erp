import api from './api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyId?: string;
  company?: any;
  roles?: string[];
  permissions?: Record<string, any>;
}

export interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

export const auth = {
  register: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    companyName?: string;
  }): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  },

  getUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: (): boolean => {
    return !!auth.getToken();
  },
};

import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // 1. Load from local storage for instant render
      const localUser = auth.getUser();
      if (localUser) setUser(localUser);

      // 2. Verify token & refresh profile (to get latest permissions)
      const token = auth.getToken();
      if (token) {
        try {
          // We need a getProfile endpoint. Assuming it exists at /auth/profile
          const res = await api.get('/auth/profile');
          if (res.data.user) {
            const updatedUser = res.data.user;
            localStorage.setItem('user', JSON.stringify(updatedUser)); // Sync local storage
            setUser(updatedUser);
          }
        } catch (error) {
          console.error("Auth refresh failed", error);
          // If 401, maybe logout? For now, just keep local or do nothing.
          // auth.logout(); 
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  return { user, loading, isAuthenticated: !!user };
};
