import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/api/client';
import type { ApiResponse, PaginatedResponse } from '@/api/common';

export interface QuoteLineInput {
  type: 'LABOR' | 'PART' | 'FEE';
  description: string;
  quantity: number;
  unitPrice: number;
  partId?: string | null;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  ticketId: string;
  customerId: string;
  status: 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'INVOICED';
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes?: string | null;
  validUntil?: string | null;
  createdAt: string;
  ticket?: { id: string; ticketNumber: string };
  customer?: { id: string; firstName: string; lastName: string };
  lines?: Array<{ id: string; description: string; quantity: number; unitPrice: number; total: number }>;
}

export interface QuoteInput {
  ticketId: string;
  validUntil?: string | null;
  notes?: string | null;
  taxRate?: number;
  lines: QuoteLineInput[];
}

export interface QuoteUpdateInput {
  validUntil?: string | null;
  notes?: string | null;
  taxRate?: number;
  lines?: QuoteLineInput[];
}

export function useQuotes(
  page = 1,
  limit = 10,
  search?: string,
  filters?: { ticketId?: string; customerId?: string; status?: string }
) {
  return useQuery({
    queryKey: ['quotes', page, limit, search, filters],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set('search', search);
      if (filters?.ticketId) params.set('ticketId', filters.ticketId);
      if (filters?.customerId) params.set('customerId', filters.customerId);
      if (filters?.status) params.set('status', filters.status);
      const res = await api.get<PaginatedResponse<Quote>>(`/quotes?${params.toString()}`);
      return res.data;
    },
  });
}

export function useQuoteById(id?: string) {
  return useQuery({
    queryKey: ['quote', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await api.get<ApiResponse<Quote>>(`/quotes/${id}`);
      return res.data.data;
    },
  });
}

export function useCreateQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: QuoteInput) => {
      const res = await api.post<ApiResponse<Quote>>('/quotes', payload);
      return res.data.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}

export function useUpdateQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: QuoteUpdateInput }) => {
      const res = await api.put<ApiResponse<Quote>>(`/quotes/${id}`, payload);
      return res.data.data;
    },
    onSuccess: async (quote) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['quotes'] }),
        queryClient.invalidateQueries({ queryKey: ['quote', quote.id] }),
      ]);
    },
  });
}

export function useUpdateQuoteStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Quote['status'] }) => {
      const res = await api.patch<ApiResponse<Quote>>(`/quotes/${id}/status`, { status });
      return res.data.data;
    },
    onSuccess: async (quote) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['quotes'] }),
        queryClient.invalidateQueries({ queryKey: ['quote', quote.id] }),
      ]);
    },
  });
}

export function useDeleteQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/quotes/${id}`);
      return id;
    },
    onSuccess: async (id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['quotes'] }),
        queryClient.removeQueries({ queryKey: ['quote', id] }),
      ]);
    },
  });
}
