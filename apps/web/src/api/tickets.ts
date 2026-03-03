import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/api/client';
import type { ApiResponse, PaginatedResponse } from '@/api/common';

export interface TicketStatus {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  customerId: string;
  deviceId: string;
  statusId: string;
  assignedTechnicianId?: string | null;
  reportedFault: string;
  accessoriesReceived: string[];
  preExistingDamage?: string | null;
  damagePhotos: string[];
  estimatedDeliveryDate?: string | null;
  publicAccessCode: string;
  createdAt: string;
  customer?: { id: string; firstName: string; lastName: string; phone: string };
  device?: { id: string; brand: string; model: string; category?: { name: string } };
  status?: TicketStatus;
  assignedTechnician?: { id: string; firstName: string; lastName: string } | null;
  notes?: Array<{ id: string; content: string; isPublic: boolean; createdAt: string; user: { firstName: string; lastName: string } }>;
  statusChanges?: Array<{ id: string; createdAt: string; fromStatus?: { name: string } | null; toStatus: { name: string } }>;
}

export interface TicketInput {
  customerId: string;
  deviceId: string;
  assignedTechnicianId?: string | null;
  reportedFault: string;
  accessoriesReceived?: string[];
  preExistingDamage?: string | null;
  damagePhotos?: string[];
  estimatedDeliveryDate?: string | null;
}

export interface TicketUpdateInput extends Partial<TicketInput> {
  statusId?: string;
}

export function useTickets(
  page = 1,
  limit = 10,
  search?: string,
  filters?: { customerId?: string; deviceId?: string; statusId?: string; assignedTechnicianId?: string }
) {
  return useQuery({
    queryKey: ['tickets', page, limit, search, filters],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set('search', search);
      if (filters?.customerId) params.set('customerId', filters.customerId);
      if (filters?.deviceId) params.set('deviceId', filters.deviceId);
      if (filters?.statusId) params.set('statusId', filters.statusId);
      if (filters?.assignedTechnicianId) params.set('assignedTechnicianId', filters.assignedTechnicianId);
      const res = await api.get<PaginatedResponse<Ticket>>(`/tickets?${params.toString()}`);
      return res.data;
    },
  });
}

export function useTicketById(id?: string, details = true) {
  return useQuery({
    queryKey: ['ticket', id, details],
    enabled: Boolean(id),
    queryFn: async () => {
      const suffix = details ? '?details=true' : '';
      const res = await api.get<ApiResponse<Ticket>>(`/tickets/${id}${suffix}`);
      return res.data.data;
    },
  });
}

export function useTicketStatuses() {
  return useQuery({
    queryKey: ['ticket-statuses'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<TicketStatus[]>>('/tickets/statuses');
      return res.data.data;
    },
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TicketInput) => {
      const res = await api.post<ApiResponse<Ticket>>('/tickets', payload);
      return res.data.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: TicketUpdateInput }) => {
      const res = await api.put<ApiResponse<Ticket>>(`/tickets/${id}`, payload);
      return res.data.data;
    },
    onSuccess: async (ticket) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tickets'] }),
        queryClient.invalidateQueries({ queryKey: ['ticket', ticket.id] }),
      ]);
    },
  });
}

export function useDeleteTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tickets/${id}`);
      return id;
    },
    onSuccess: async (id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tickets'] }),
        queryClient.removeQueries({ queryKey: ['ticket', id] }),
      ]);
    },
  });
}

export function useAddTicketNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticketId, content, isPublic }: { ticketId: string; content: string; isPublic?: boolean }) => {
      const res = await api.post<ApiResponse<unknown>>(`/tickets/${ticketId}/notes`, { content, isPublic: Boolean(isPublic) });
      return { ticketId, note: res.data.data };
    },
    onSuccess: async ({ ticketId }) => {
      await queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
    },
  });
}
