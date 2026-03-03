import { z } from 'zod';

export const ticketBaseSchema = z.object({
    customerId: z.string().min(1, 'Customer ID is required'),
    deviceId: z.string().min(1, 'Device ID is required'),
    statusId: z.string().optional(),
    assignedTechnicianId: z.string().optional().nullable(),
    reportedFault: z.string().min(1, 'Reported fault is required'),
    accessoriesReceived: z.array(z.string()).optional().default([]),
    preExistingDamage: z.string().optional().nullable(),
    damagePhotos: z.array(z.string()).optional().default([]),
    estimatedDeliveryDate: z.coerce.date().optional().nullable(),
});

export const createTicketSchema = ticketBaseSchema.omit({ statusId: true });

export const updateTicketSchema = ticketBaseSchema.partial();

export const ticketQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    search: z.string().optional(),
    customerId: z.string().optional(),
    deviceId: z.string().optional(),
    statusId: z.string().optional(),
    assignedTechnicianId: z.string().optional(),
});

export const ticketNoteSchema = z.object({
    content: z.string().min(1, 'Content is required'),
    isPublic: z.boolean().optional().default(false),
});
