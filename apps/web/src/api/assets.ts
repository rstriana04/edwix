import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/api/client';
import type { ApiResponse, PaginatedResponse } from '@/api/common';

export interface Asset {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  serialNumber: string | null;
  purchaseDate: string | null;
  purchaseCost: number | null;
  warrantyExpiry: string | null;
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'RETIRED';
  location: string | null;
  notes: string | null;
  photos: string[];
  createdAt: string;
  updatedAt: string;
  checkouts?: AssetCheckout[];
}

export interface AssetInput {
  name: string;
  description?: string | null;
  category?: string | null;
  serialNumber?: string | null;
  purchaseDate?: string | null;
  purchaseCost?: number | null;
  warrantyExpiry?: string | null;
  location?: string | null;
  notes?: string | null;
  photos?: string[];
  status?: string;
}

export interface AssetCheckout {
  id: string;
  assetId: string;
  checkedOutToId: string;
  checkedOutById: string;
  checkedOutAt: string;
  checkedInAt: string | null;
  notes: string | null;
  checkedOutTo?: { id: string; firstName: string; lastName: string; email: string };
  checkedOutBy?: { id: string; firstName: string; lastName: string };
}

export interface AssetMaintenance {
  id: string;
  assetId: string;
  description: string;
  performedById: string;
  cost: number | null;
  performedAt: string;
  nextMaintenanceDate: string | null;
  notes: string | null;
  performedBy?: { id: string; firstName: string; lastName: string };
}

export interface CheckoutInput {
  checkedOutToId: string;
  notes?: string | null;
}

export interface MaintenanceInput {
  description: string;
  cost?: number | null;
  performedAt?: string;
  nextMaintenanceDate?: string | null;
  notes?: string | null;
}

// ── List & Detail ───────────────────────────────

export function useAssets(page = 1, limit = 10, search?: string, status?: string, category?: string) {
  return useQuery({
    queryKey: ['assets', page, limit, search, status, category],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      if (category) params.set('category', category);
      const res = await api.get<PaginatedResponse<Asset>>(`/assets?${params.toString()}`);
      return res.data;
    },
  });
}

export function useAssetById(id?: string) {
  return useQuery({
    queryKey: ['asset', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await api.get<ApiResponse<Asset>>(`/assets/${id}`);
      return res.data.data;
    },
  });
}

// ── CRUD ────────────────────────────────────────

export function useCreateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AssetInput) => {
      const res = await api.post<ApiResponse<Asset>>('/assets', payload);
      return res.data.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<AssetInput> }) => {
      const res = await api.put<ApiResponse<Asset>>(`/assets/${id}`, payload);
      return res.data.data;
    },
    onSuccess: async (asset) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['assets'] }),
        queryClient.invalidateQueries({ queryKey: ['asset', asset.id] }),
      ]);
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/assets/${id}`);
      return id;
    },
    onSuccess: async (id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['assets'] }),
        queryClient.removeQueries({ queryKey: ['asset', id] }),
      ]);
    },
  });
}

// ── Checkout / Checkin ──────────────────────────

export function useCheckoutAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ assetId, payload }: { assetId: string; payload: CheckoutInput }) => {
      const res = await api.post<ApiResponse<AssetCheckout>>(`/assets/${assetId}/checkout`, payload);
      return { assetId, checkout: res.data.data };
    },
    onSuccess: async ({ assetId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['assets'] }),
        queryClient.invalidateQueries({ queryKey: ['asset', assetId] }),
        queryClient.invalidateQueries({ queryKey: ['asset-checkouts', assetId] }),
      ]);
    },
  });
}

export function useCheckinAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ assetId, notes }: { assetId: string; notes?: string | null }) => {
      const res = await api.post<ApiResponse<Asset>>(`/assets/${assetId}/checkin`, { notes });
      return { assetId, asset: res.data.data };
    },
    onSuccess: async ({ assetId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['assets'] }),
        queryClient.invalidateQueries({ queryKey: ['asset', assetId] }),
        queryClient.invalidateQueries({ queryKey: ['asset-checkouts', assetId] }),
      ]);
    },
  });
}

// ── Maintenance ─────────────────────────────────

export function useAssetCheckouts(assetId?: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: ['asset-checkouts', assetId, page, limit],
    enabled: Boolean(assetId),
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      const res = await api.get<PaginatedResponse<AssetCheckout>>(`/assets/${assetId}/checkouts?${params.toString()}`);
      return res.data;
    },
  });
}

export function useAssetMaintenanceLog(assetId?: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: ['asset-maintenance', assetId, page, limit],
    enabled: Boolean(assetId),
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      const res = await api.get<PaginatedResponse<AssetMaintenance>>(`/assets/${assetId}/maintenance?${params.toString()}`);
      return res.data;
    },
  });
}

export function useAddAssetMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ assetId, payload }: { assetId: string; payload: MaintenanceInput }) => {
      const res = await api.post<ApiResponse<AssetMaintenance>>(`/assets/${assetId}/maintenance`, payload);
      return { assetId, maintenance: res.data.data };
    },
    onSuccess: async ({ assetId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['assets'] }),
        queryClient.invalidateQueries({ queryKey: ['asset', assetId] }),
        queryClient.invalidateQueries({ queryKey: ['asset-maintenance', assetId] }),
      ]);
    },
  });
}
