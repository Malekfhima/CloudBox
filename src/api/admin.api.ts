import { apiClient } from './client';
import type {
  ActivityEvent,
  AdminOverviewData,
  AdminStorageData,
  AdminSystemStats,
  PlanTier,
  SubscriptionRecord,
  User,
} from '@/src/types';

export const adminApi = {
  getOverview: async () => {
    const { data } = await apiClient.get<AdminOverviewData>('/admin/overview');
    return data;
  },

  getUsers: async (params?: { search?: string; role?: string }) => {
    const { data } = await apiClient.get<{ users: User[] }>('/admin/users', { params });
    return data.users;
  },

  createUser: async (payload: {
    name: string;
    email: string;
    role: 'user' | 'admin';
    plan: PlanTier;
    company?: string;
  }) => {
    const { data } = await apiClient.post<{ user: User }>('/admin/users', payload);
    return data.user;
  },

  updateUser: async (
    id: string,
    payload: {
      role?: 'user' | 'admin';
      status?: 'active' | 'suspended';
      plan?: PlanTier;
      storageQuotaGb?: number;
    },
  ) => {
    const { data } = await apiClient.patch<{ user: User }>(`/admin/users/${id}`, payload);
    return data.user;
  },

  deleteUser: async (id: string) => {
    await apiClient.delete(`/admin/users/${id}`);
  },

  getStorage: async () => {
    const { data } = await apiClient.get<AdminStorageData>('/admin/storage');
    return data;
  },

  updateStorageSettings: async (payload: {
    defaultUserQuotaGb: number;
    maxUploadSizeMb: number;
  }) => {
    const { data } = await apiClient.patch<{
      defaultUserQuotaGb: number;
      maxUploadSizeMb: number;
    }>('/admin/storage/settings', payload);
    return data;
  },

  getLogs: async (params?: { action?: string; search?: string }) => {
    const { data } = await apiClient.get<{ logs: ActivityEvent[] }>('/admin/logs', { params });
    return data.logs;
  },

  getSystemStats: async () => {
    const { data } = await apiClient.get<AdminSystemStats>('/admin/stats');
    return data;
  },

  getSubscriptions: async () => {
    const { data } = await apiClient.get<{ subscriptions: SubscriptionRecord[] }>(
      '/admin/subscriptions',
    );
    return data.subscriptions;
  },

  updateSubscription: async (
    id: string,
    payload: { plan?: PlanTier; seats?: number; status?: 'active' | 'past_due' | 'canceled' },
  ) => {
    const { data } = await apiClient.patch<{ subscription: SubscriptionRecord }>(
      `/admin/subscriptions/${id}`,
      payload,
    );
    return data.subscription;
  },
};
