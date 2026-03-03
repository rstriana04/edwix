import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/api/client';
import type { ApiResponse, PaginatedResponse } from '@/api/common';

export interface Supplier {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  paymentTerms: string | null;
  deliveryNotes: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierInput {
  name: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  paymentTerms?: string | null;
  deliveryNotes?: string | null;
  notes?: string | null;
}

export function useSuppliers(page = 1, limit = 10, search?: string) {
  return useQuery({
    queryKey: ['suppliers', page, limit, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set('search', search);
      const res = await api.get<PaginatedResponse<Supplier>>(`/suppliers?${params.toString()}`);
      return res.data;
    },
  });
}

export function useSupplierById(id?: string) {
  return useQuery({
    queryKey: ['supplier', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await api.get<ApiResponse<Supplier>>(`/suppliers/${id}`);
      return res.data.data;
    },
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SupplierInput) => {
      const res = await api.post<ApiResponse<Supplier>>('/suppliers', payload);
      return res.data.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<SupplierInput> }) => {
      const res = await api.put<ApiResponse<Supplier>>(`/suppliers/${id}`, payload);
      return res.data.data;
    },
    onSuccess: async (supplier) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
        queryClient.invalidateQueries({ queryKey: ['supplier', supplier.id] }),
      ]);
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/suppliers/${id}`);
      return id;
    },
    onSuccess: async (id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
        queryClient.removeQueries({ queryKey: ['supplier', id] }),
      ]);
    },
  });
}
