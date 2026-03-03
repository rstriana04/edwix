import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/api/client';
import type { ApiResponse, PaginatedResponse } from '@/api/common';

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  idDocument: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerInput {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  idDocument?: string | null;
  address?: string | null;
  notes?: string | null;
}

export function useCustomers(page = 1, limit = 10, search?: string) {
  return useQuery({
    queryKey: ['customers', page, limit, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set('search', search);
      const res = await api.get<PaginatedResponse<Customer>>(`/customers?${params.toString()}`);
      return res.data;
    },
  });
}

export function useCustomerById(id?: string) {
  return useQuery({
    queryKey: ['customer', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await api.get<ApiResponse<Customer>>(`/customers/${id}`);
      return res.data.data;
    },
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CustomerInput) => {
      const res = await api.post<ApiResponse<Customer>>('/customers', payload);
      return res.data.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<CustomerInput> }) => {
      const res = await api.put<ApiResponse<Customer>>(`/customers/${id}`, payload);
      return res.data.data;
    },
    onSuccess: async (customer) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['customers'] }),
        queryClient.invalidateQueries({ queryKey: ['customer', customer.id] }),
      ]);
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/customers/${id}`);
      return id;
    },
    onSuccess: async (id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['customers'] }),
        queryClient.removeQueries({ queryKey: ['customer', id] }),
      ]);
    },
  });
}
