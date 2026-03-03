import { z } from 'zod';
import { QuoteStatus, QuoteLineType } from '@edwix/shared';

export const quoteLineSchema = z.object({
    type: z.nativeEnum(QuoteLineType),
    description: z.string().min(1, 'Description is required'),
    quantity: z.coerce.number().positive(),
    unitPrice: z.coerce.number().min(0),
    partId: z.string().optional().nullable(),
});

export const createQuoteSchema = z.object({
    ticketId: z.string().min(1, 'Ticket ID is required'),
    validUntil: z.coerce.date().optional().nullable(),
    notes: z.string().optional().nullable(),
    taxRate: z.coerce.number().min(0).max(100).optional().default(0),
    lines: z.array(quoteLineSchema).min(1, 'At least one line is required'),
});

export const updateQuoteSchema = z.object({
    validUntil: z.coerce.date().optional().nullable(),
    notes: z.string().optional().nullable(),
    taxRate: z.coerce.number().min(0).max(100).optional(),
    lines: z.array(quoteLineSchema).min(1).optional(),
});

export const quoteStatusSchema = z.object({
    status: z.nativeEnum(QuoteStatus),
});

export const quoteQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    search: z.string().optional(),
    ticketId: z.string().optional(),
    customerId: z.string().optional(),
    status: z.nativeEnum(QuoteStatus).optional(),
});
