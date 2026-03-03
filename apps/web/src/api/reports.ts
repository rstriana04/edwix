import { useQuery } from '@tanstack/react-query';
import api from '@/api/client';
import type { ApiResponse } from '@/api/common';

export interface ReportSummary {
  monthlyRevenue: number;
  openTickets: number;
  lowStockCount: number;
}

export interface RevenuePeriod {
  period: string;
  totalRevenue: number;
  paymentCount: number;
  byMethod: Record<string, number>;
}

export interface RevenueReport {
  periods: RevenuePeriod[];
  summary: { totalRevenue: number; totalPayments: number; averagePayment: number };
}

export interface TicketStatsReport {
  totalTickets: number;
  byStatus: { status: string; count: number }[];
  averageResolutionHours: number;
  overdueCount: number;
}

export interface TechnicianEntry {
  id: string;
  name: string;
  assignedTickets: number;
  completedTickets: number;
  averageResolutionHours: number;
  totalLaborMinutes: number;
  totalLaborRevenue: number;
}

export interface TechnicianReport {
  technicians: TechnicianEntry[];
}

export interface LowStockPart {
  id: string;
  sku: string;
  name: string;
  stockQuantity: number;
  minimumStock: number;
}

export interface InventoryReport {
  totalParts: number;
  totalValue: number;
  lowStockParts: LowStockPart[];
  byCategory: { category: string; count: number; value: number }[];
}

export interface TopCustomerEntry {
  id: string;
  name: string;
  totalSpent: number;
  invoiceCount: number;
}

export interface TopCustomersReport {
  customers: TopCustomerEntry[];
}

export interface PartsUsageEntry {
  id: string;
  sku: string;
  name: string;
  totalUsed: number;
  totalRevenue: number;
}

export interface PartsUsageReport {
  parts: PartsUsageEntry[];
}

// ── Hooks ───────────────────────────────────────

export function useReportSummary() {
  return useQuery({
    queryKey: ['report-summary'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<ReportSummary>>('/reports/summary');
      return res.data.data;
    },
  });
}

export function useRevenueReport(from?: string, to?: string, groupBy?: string) {
  return useQuery({
    queryKey: ['report-revenue', from, to, groupBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      if (groupBy) params.set('groupBy', groupBy);
      const res = await api.get<ApiResponse<RevenueReport>>(`/reports/revenue?${params.toString()}`);
      return res.data.data;
    },
  });
}

export function useTicketStatsReport(from?: string, to?: string) {
  return useQuery({
    queryKey: ['report-tickets', from, to],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const res = await api.get<ApiResponse<TicketStatsReport>>(`/reports/tickets?${params.toString()}`);
      return res.data.data;
    },
  });
}

export function useTechnicianReport(from?: string, to?: string) {
  return useQuery({
    queryKey: ['report-technicians', from, to],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const res = await api.get<ApiResponse<TechnicianReport>>(`/reports/technicians?${params.toString()}`);
      return res.data.data;
    },
  });
}

export function useInventoryReport(lowStockOnly?: boolean) {
  return useQuery({
    queryKey: ['report-inventory', lowStockOnly],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (lowStockOnly) params.set('lowStockOnly', 'true');
      const res = await api.get<ApiResponse<InventoryReport>>(`/reports/inventory?${params.toString()}`);
      return res.data.data;
    },
  });
}

export function useTopCustomersReport(from?: string, to?: string, limit?: number) {
  return useQuery({
    queryKey: ['report-customers', from, to, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      if (limit) params.set('limit', String(limit));
      const res = await api.get<ApiResponse<TopCustomersReport>>(`/reports/top-customers?${params.toString()}`);
      return res.data.data;
    },
  });
}

export function usePartsUsageReport(from?: string, to?: string, limit?: number) {
  return useQuery({
    queryKey: ['report-parts', from, to, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      if (limit) params.set('limit', String(limit));
      const res = await api.get<ApiResponse<PartsUsageReport>>(`/reports/parts-usage?${params.toString()}`);
      return res.data.data;
    },
  });
}
