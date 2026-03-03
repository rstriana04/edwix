import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/api/client';
import type { ApiResponse, PaginatedResponse } from '@/api/common';

export interface DeviceCategory {
  id: string;
  name: string;
  icon?: string | null;
}

export interface Device {
  id: string;
  customerId: string;
  categoryId: string;
  brand: string;
  model: string;
  serialNumber: string | null;
  color: string | null;
  imei: string | null;
  notes: string | null;
  photos: string[];
  category?: DeviceCategory;
  customer?: { id: string; firstName: string; lastName: string; phone: string };
}

export interface DeviceInput {
  customerId: string;
  categoryId: string;
  brand: string;
  model: string;
  serialNumber?: string | null;
  color?: string | null;
  imei?: string | null;
  notes?: string | null;
  photos?: string[];
}

export function useDevices(page = 1, limit = 10, search?: string, customerId?: string, categoryId?: string) {
  return useQuery({
    queryKey: ['devices', page, limit, search, customerId, categoryId],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set('search', search);
      if (customerId) params.set('customerId', customerId);
      if (categoryId) params.set('categoryId', categoryId);
      const res = await api.get<PaginatedResponse<Device>>(`/devices?${params.toString()}`);
      return res.data;
    },
  });
}

export function useDeviceById(id?: string) {
  return useQuery({
    queryKey: ['device', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await api.get<ApiResponse<Device>>(`/devices/${id}`);
      return res.data.data;
    },
  });
}

export function useDeviceCategories() {
  return useQuery({
    queryKey: ['device-categories'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<DeviceCategory[]>>('/devices/categories');
      return res.data.data;
    },
  });
}

export function useCreateDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: DeviceInput) => {
      const res = await api.post<ApiResponse<Device>>('/devices', payload);
      return res.data.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
}

export function useUpdateDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<DeviceInput> }) => {
      const res = await api.put<ApiResponse<Device>>(`/devices/${id}`, payload);
      return res.data.data;
    },
    onSuccess: async (device) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['devices'] }),
        queryClient.invalidateQueries({ queryKey: ['device', device.id] }),
      ]);
    },
  });
}

export function useDeleteDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/devices/${id}`);
      return id;
    },
    onSuccess: async (id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['devices'] }),
        queryClient.removeQueries({ queryKey: ['device', id] }),
      ]);
    },
  });
}
