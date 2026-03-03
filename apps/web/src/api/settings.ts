import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/api/client';
import type { ApiResponse } from '@/api/common';

export interface BusinessProfile {
  id: string;
  name: string;
  logo: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  taxId: string | null;
  footerText: string | null;
  currency: string;
}

export interface BusinessProfileInput {
  name: string;
  logo?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  taxId?: string | null;
  footerText?: string | null;
  currency?: string;
}

export interface LaborRate {
  id: string;
  deviceCategoryId: string;
  description: string;
  ratePerHour: number;
  deviceCategory?: { id: string; name: string } | null;
}

export interface LaborRateInput {
  deviceCategoryId: string;
  description: string;
  ratePerHour: number;
}

export interface SettingEntry {
  id: string;
  key: string;
  value: string;
}

// ── Business Profile ────────────────────────────

export function useBusinessProfile() {
  return useQuery({
    queryKey: ['business-profile'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<BusinessProfile>>('/settings/business-profile');
      return res.data.data;
    },
  });
}

export function useUpdateBusinessProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: BusinessProfileInput) => {
      const res = await api.put<ApiResponse<BusinessProfile>>('/settings/business-profile', payload);
      return res.data.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['business-profile'] });
    },
  });
}

// ── Labor Rates ─────────────────────────────────

export function useLaborRates() {
  return useQuery({
    queryKey: ['labor-rates'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<LaborRate[]>>('/settings/labor-rates');
      return res.data.data;
    },
  });
}

export function useCreateLaborRate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: LaborRateInput) => {
      const res = await api.post<ApiResponse<LaborRate>>('/settings/labor-rates', payload);
      return res.data.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['labor-rates'] });
    },
  });
}

export function useUpdateLaborRate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<LaborRateInput> }) => {
      const res = await api.put<ApiResponse<LaborRate>>(`/settings/labor-rates/${id}`, payload);
      return res.data.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['labor-rates'] });
    },
  });
}

export function useDeleteLaborRate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/settings/labor-rates/${id}`);
      return id;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['labor-rates'] });
    },
  });
}

// ── General Settings ────────────────────────────

export function useGeneralSettings(prefix?: string) {
  return useQuery({
    queryKey: ['settings', prefix],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (prefix) params.set('prefix', prefix);
      const res = await api.get<ApiResponse<SettingEntry[]>>(`/settings/general?${params.toString()}`);
      return res.data.data;
    },
  });
}

export function useUpsertSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { key: string; value: string }) => {
      const res = await api.put<ApiResponse<SettingEntry>>('/settings/general', payload);
      return res.data.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

export function useDeleteSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (key: string) => {
      await api.delete(`/settings/general/${encodeURIComponent(key)}`);
      return key;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}
