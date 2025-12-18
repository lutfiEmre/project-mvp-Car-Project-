'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { api, setAuthToken } from '@/lib/api';

export function useAuth() {
  const { user, isAuthenticated, isLoading, login, logout, setLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        setAuthToken(token);
        try {
          const userData = await api.auth.me();
          login(userData, token);
        } catch (error) {
          // Silently fail - user is not authenticated or API is not available
          console.warn('Auth check failed:', error instanceof Error ? error.message : 'Unknown error');
          logout();
          setAuthToken(null);
        }
      }
      setLoading(false);
    };

    // Only run in browser
    if (typeof window !== 'undefined') {
      initAuth();
    }
  }, [login, logout, setLoading]);

  const handleLogin = async (email: string, password: string) => {
    const response = await api.auth.login({ email, password });
    setAuthToken(response.accessToken);
    login(response.user, response.accessToken);
    return response;
  };

  const handleRegister = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: 'USER' | 'DEALER';
    dealer?: {
      businessName: string;
      phone?: string;
      address?: string;
      city?: string;
      province?: string;
    };
  }) => {
    const response = await api.auth.register(data);
    setAuthToken(response.accessToken);
    login(response.user, response.accessToken);
    return response;
  };

  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch {}
    setAuthToken(null);
    logout();
    router.push('/');
  };

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        const userData = await api.auth.me();
        login(userData, token);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    refreshUser,
  };
}

