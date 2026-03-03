import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/api/client';
import type { ApiResponse, PaginatedResponse } from '@/api/common';
import type { QuoteLineInput } from '@/api/quotes';

export interface Payment {
  id: string;
  amount: number;
  method: 'CASH' | 'CARD' | 'BANK_TRANSFER';
  reference?: string | null;
  notes?: string | null;
  paidAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  quoteId?: string | null;
  ticketId: string;
  customerId: string;
  status: 'DRAFT' | 'SENT' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  dueDate?: string | null;
  notes?: string | null;
  createdAt: string;
  customer?: { id: string; firstName: string; lastName: string };
  ticket?: { id: string; ticketNumber: string };
  quote?: { id: string; quoteNumber: string } | null;
  lines?: Array<{ id: string; description: string; quantity: number; unitPrice: number; total: number }>;
  payments?: Payment[];
}

export interface InvoiceInput {
  ticketId: string;
  quoteId?: string | null;
  dueDate?: string | null;
  notes?: string | null;
  taxRate?: number;
  lines: QuoteLineInput[];
}

export interface InvoiceUpdateInput {
  dueDate?: string | null;
  notes?: string | null;
  taxRate?: number;
  lines?: QuoteLineInput[];
}

export interface PaymentInput {
  amount: number;
  method: 'CASH' | 'CARD' | 'BANK_TRANSFER';
  reference?: string | null;
  notes?: string | null;
}

export function useInvoices(
  page = 1,
  limit = 10,
  search?: string,
  filters?: { ticketId?: string; customerId?: string; quoteId?: string; status?: string }
) {
  return useQuery({
    queryKey: ['invoices', page, limit, search, filters],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set('search', search);
      if (filters?.ticketId) params.set('ticketId', filters.ticketId);
      if (filters?.customerId) params.set('customerId', filters.customerId);
      if (filters?.quoteId) params.set('quoteId', filters.quoteId);
      if (filters?.status) params.set('status', filters.status);
      const res = await api.get<PaginatedResponse<Invoice>>(`/invoices?${params.toString()}`);
      return res.data;
    },
  });
}

export function useInvoiceById(id?: string) {
  return useQuery({
    queryKey: ['invoice', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await api.get<ApiResponse<Invoice>>(`/invoices/${id}`);
      return res.data.data;
    },
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: InvoiceInput) => {
      const res = await api.post<ApiResponse<Invoice>>('/invoices', payload);
      return res.data.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: InvoiceUpdateInput }) => {
      const res = await api.put<ApiResponse<Invoice>>(`/invoices/${id}`, payload);
      return res.data.data;
    },
    onSuccess: async (invoice) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['invoices'] }),
        queryClient.invalidateQueries({ queryKey: ['invoice', invoice.id] }),
      ]);
    },
  });
}

export function useAddPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ invoiceId, payload }: { invoiceId: string; payload: PaymentInput }) => {
      const res = await api.post<ApiResponse<Payment>>(`/invoices/${invoiceId}/payments`, payload);
      return { invoiceId, payment: res.data.data };
    },
    onSuccess: async ({ invoiceId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['invoices'] }),
        queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] }),
      ]);
    },
  });
}
