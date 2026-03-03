import { useQuery } from '@tanstack/react-query';
import api from '@/api/client';
import type { ApiResponse } from '@/api/common';

export interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<UserSummary[]>>('/auth/users');
      return res.data.data;
    },
  });
}
