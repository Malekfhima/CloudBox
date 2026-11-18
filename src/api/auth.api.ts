import { apiClient } from './client';
import type { AuthResponse, User } from '@/src/types';

export const authApi = {
  login: async (payload: { email: string; password: string }) => {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
    return data;
  },

  register: async (payload: {
    name: string;
    email: string;
    password: string;
    company?: string;
  }) => {
    const { data } = await apiClient.post<{
      message: string;
      user: User;
      verificationCodeHint: string;
    }>('/auth/register', payload);
    return data;
  },

  verifyEmail: async (payload: { email: string; code: string }) => {
    const { data } = await apiClient.post<AuthResponse & { message: string }>(
      '/auth/verify-email',
      payload,
    );
    return data;
  },

  forgotPassword: async (payload: { email: string }) => {
    const { data } = await apiClient.post<{ message: string; resetTokenHint?: string }>(
      '/auth/forgot-password',
      payload,
    );
    return data;
  },

  resetPassword: async (payload: { token: string; password: string }) => {
    const { data } = await apiClient.post<{ message: string }>('/auth/reset-password', payload);
    return data;
  },

  logout: async (refreshToken: string | null) => {
    await apiClient.post('/auth/logout', { refreshToken });
  },

  me: async () => {
    const { data } = await apiClient.get<{ user: User }>('/auth/me');
    return data.user;
  },
};
