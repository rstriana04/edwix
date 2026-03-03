import { useQuery } from '@tanstack/react-query';
import api from '@/api/client';
import type { ApiResponse } from '@/api/common';

export interface DashboardIndicators {
  openTickets: number;
  overdueTickets: number;
  readyForDeliveryTickets: number;
  averageRepairHours: number;
}

export function useDashboardIndicators() {
  return useQuery({
    queryKey: ['dashboard-indicators'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<DashboardIndicators>>('/dashboard/indicators');
      return res.data.data;
    },
  });
}
