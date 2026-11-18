import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminApi } from '@/src/api/admin.api';
import { getErrorMessage } from '@/src/lib/utils';

export function useAdminOverview() {
  return useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: adminApi.getOverview,
  });
}

export function useAdminUsers(params?: { search?: string; role?: string }) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => adminApi.getUsers(params),
  });
}

export function useAdminStorage() {
  return useQuery({
    queryKey: ['admin', 'storage'],
    queryFn: adminApi.getStorage,
  });
}

export function useAdminLogs(params?: { action?: string; search?: string }) {
  return useQuery({
    queryKey: ['admin', 'logs', params],
    queryFn: () => adminApi.getLogs(params),
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: adminApi.getSystemStats,
  });
}

export function useAdminSubscriptions() {
  return useQuery({
    queryKey: ['admin', 'subscriptions'],
    queryFn: adminApi.getSubscriptions,
  });
}

export function useAdminMutations() {
  const queryClient = useQueryClient();

  const createUser = useMutation({
    mutationFn: adminApi.createUser,
    onSuccess: (user) => {
      toast.success(`Provisioned account for ${user.name}.`);
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateUser = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof adminApi.updateUser>[1];
    }) => adminApi.updateUser(id, payload),
    onSuccess: () => {
      toast.success('User account updated.');
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteUser = useMutation({
    mutationFn: adminApi.deleteUser,
    onSuccess: () => {
      toast.success('User removed.');
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateStorageSettings = useMutation({
    mutationFn: adminApi.updateStorageSettings,
    onSuccess: () => {
      toast.success('Workspace storage policy updated.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'storage'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateSubscription = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof adminApi.updateSubscription>[1];
    }) => adminApi.updateSubscription(id, payload),
    onSuccess: () => {
      toast.success('Subscription updated.');
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return {
    createUser,
    updateUser,
    deleteUser,
    updateStorageSettings,
    updateSubscription,
  };
}
