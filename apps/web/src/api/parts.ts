import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/api/client';
import type { ApiResponse, PaginatedResponse } from '@/api/common';

export interface PartCategory {
  id: string;
  name: string;
  parentId: string | null;
}

export interface Part {
  id: string;
  sku: string;
  name: string;
  description?: string | null;
  type: string;
  unit: string;
  costPrice: number;
  salePrice: number;
  stockQuantity: number;
  minimumStock: number;
  storageLocation?: string | null;
  compatibleBrands: string[];
  compatibleModels: string[];
  categoryId?: string | null;
  category?: PartCategory | null;
}

export interface PartInput {
  sku?: string;
  name: string;
  description?: string | null;
  type: string;
  categoryId?: string | null;
  unit: string;
  costPrice: number;
  salePrice: number;
  minimumStock?: number;
  storageLocation?: string | null;
  compatibleBrands?: string[];
  compatibleModels?: string[];
}

export interface StockMovementInput {
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reason?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
}

export function useParts(page = 1, limit = 10, search?: string, categoryId?: string, type?: string) {
  return useQuery({
    queryKey: ['parts', page, limit, search, categoryId, type],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set('search', search);
      if (categoryId) params.set('categoryId', categoryId);
      if (type) params.set('type', type);
      const res = await api.get<PaginatedResponse<Part>>(`/parts?${params.toString()}`);
      return res.data;
    },
  });
}

export function usePartById(id?: string, details = true) {
  return useQuery({
    queryKey: ['part', id, details],
    enabled: Boolean(id),
    queryFn: async () => {
      const suffix = details ? '?details=true' : '';
      const res = await api.get<ApiResponse<Part>>(`/parts/${id}${suffix}`);
      return res.data.data;
    },
  });
}

export function usePartCategories() {
  return useQuery({
    queryKey: ['part-categories'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<PartCategory[]>>('/parts/categories');
      return res.data.data;
    },
  });
}

export function usePartMovements(partId?: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: ['part-movements', partId, page, limit],
    enabled: Boolean(partId),
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      const res = await api.get<PaginatedResponse<unknown>>(`/parts/${partId}/movements?${params.toString()}`);
      return res.data;
    },
  });
}

export function useCreatePart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: PartInput) => {
      const res = await api.post<ApiResponse<Part>>('/parts', payload);
      return res.data.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['parts'] });
    },
  });
}

export function useUpdatePart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<PartInput> }) => {
      const res = await api.put<ApiResponse<Part>>(`/parts/${id}`, payload);
      return res.data.data;
    },
    onSuccess: async (part) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['parts'] }),
        queryClient.invalidateQueries({ queryKey: ['part', part.id] }),
      ]);
    },
  });
}

export function useDeletePart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/parts/${id}`);
      return id;
    },
    onSuccess: async (id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['parts'] }),
        queryClient.removeQueries({ queryKey: ['part', id] }),
      ]);
    },
  });
}

export function useCreateStockMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ partId, payload }: { partId: string; payload: StockMovementInput }) => {
      const res = await api.post<ApiResponse<unknown>>(`/parts/${partId}/movements`, payload);
      return { partId, movement: res.data.data };
    },
    onSuccess: async ({ partId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['parts'] }),
        queryClient.invalidateQueries({ queryKey: ['part', partId] }),
        queryClient.invalidateQueries({ queryKey: ['part-movements', partId] }),
      ]);
    },
  });
}
