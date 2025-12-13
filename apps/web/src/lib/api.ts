import { createApiClient } from '@carhaus/api-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const api = createApiClient(API_BASE_URL);

export const setAuthToken = (token: string | null) => {
  api.setAccessToken(token);
  if (token) {
    localStorage.setItem('accessToken', token);
  } else {
    localStorage.removeItem('accessToken');
  }
};

export const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
};

export const initializeAuth = () => {
  const token = getStoredToken();
  if (token) {
    api.setAccessToken(token);
  }
};

