import { apiClient } from './client';
import type { ContactFormValues } from '@/src/lib/validators';

export const publicApi = {
  submitContact: async (payload: ContactFormValues) => {
    const { data } = await apiClient.post<{ message: string; ticketId: string }>(
      '/contact',
      payload,
    );
    return data;
  },
};
