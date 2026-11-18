import { apiClient } from './client';
import type {
  DashboardOverview,
  NotificationItem,
  StorageUsageDetails,
  User,
  UserSession,
} from '@/src/types';

export const dashboardApi = {
  getOverview: async () => {
    const { data } = await apiClient.get<DashboardOverview>('/dashboard/overview');
    return data;
  },

  getStorageUsage: async () => {
    const { data } = await apiClient.get<StorageUsageDetails>('/storage/usage');
    return data;
  },

  getNotifications: async () => {
    const { data } = await apiClient.get<{
      notifications: NotificationItem[];
      unreadCount: number;
    }>('/notifications');
    return data;
  },

  markNotificationRead: async (id: string) => {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  markAllNotificationsRead: async () => {
    await apiClient.post('/notifications/read-all');
  },

  updateProfile: async (payload: {
    name: string;
    title?: string;
    company?: string;
    timezone: string;
  }) => {
    const { data } = await apiClient.patch<{ user: User }>('/users/profile', payload);
    return data.user;
  },

  changePassword: async (payload: { currentPassword: string; newPassword: string }) => {
    const { data } = await apiClient.patch<{ message: string }>('/users/password', payload);
    return data;
  },

  updateSecurity: async (payload: {
    twoFactorEnabled?: boolean;
    sessionTimeoutMinutes?: number;
    loginAlertsEnabled?: boolean;
  }) => {
    const { data } = await apiClient.patch<{ user: User }>('/users/security', payload);
    return data.user;
  },

  getSessions: async () => {
    const { data } = await apiClient.get<{ sessions: UserSession[] }>('/users/sessions');
    return data.sessions;
  },

  revokeSession: async (id: string) => {
    await apiClient.delete(`/users/sessions/${id}`);
  },
};
