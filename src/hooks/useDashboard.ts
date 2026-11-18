import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { dashboardApi } from '@/src/api/dashboard.api';
import { getErrorMessage } from '@/src/lib/utils';
import { useAuthStore } from '@/src/store/authStore';

export function useDashboardOverview() {
  return useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: dashboardApi.getOverview,
  });
}

export function useStorageUsage() {
  return useQuery({
    queryKey: ['storage', 'usage'],
    queryFn: dashboardApi.getStorageUsage,
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: dashboardApi.getNotifications,
  });
}

export function useSessions() {
  return useQuery({
    queryKey: ['users', 'sessions'],
    queryFn: dashboardApi.getSessions,
  });
}

export function useSettingsMutations() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);

  const markRead = useMutation({
    mutationFn: dashboardApi.markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllRead = useMutation({
    mutationFn: dashboardApi.markAllNotificationsRead,
    onSuccess: () => {
      toast.success('All notifications marked as read.');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const updateProfile = useMutation({
    mutationFn: dashboardApi.updateProfile,
    onSuccess: (user) => {
      updateUser(user);
      toast.success('Profile updated.');
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const changePassword = useMutation({
    mutationFn: dashboardApi.changePassword,
    onSuccess: (res) => toast.success(res.message),
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateSecurity = useMutation({
    mutationFn: dashboardApi.updateSecurity,
    onSuccess: (user) => {
      updateUser(user);
      toast.success('Security preferences updated.');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const revokeSession = useMutation({
    mutationFn: dashboardApi.revokeSession,
    onSuccess: () => {
      toast.success('Session revoked.');
      queryClient.invalidateQueries({ queryKey: ['users', 'sessions'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return {
    markRead,
    markAllRead,
    updateProfile,
    changePassword,
    updateSecurity,
    revokeSession,
  };
}
