import { z } from 'zod';
import { InvoiceStatus, QuoteLineType, PaymentMethod } from '@edwix/shared';

export const invoiceLineSchema = z.object({
    type: z.nativeEnum(QuoteLineType),
    description: z.string().min(1, 'Description is required'),
    quantity: z.coerce.number().positive(),
    unitPrice: z.coerce.number().min(0),
    partId: z.string().optional().nullable(),
});

export const createInvoiceSchema = z.object({
    ticketId: z.string().min(1, 'Ticket ID is required'),
    quoteId: z.string().optional().nullable(),
    dueDate: z.coerce.date().optional().nullable(),
    notes: z.string().optional().nullable(),
    taxRate: z.coerce.number().min(0).max(100).optional().default(0),
    lines: z.array(invoiceLineSchema).min(1, 'At least one line is required'),
});

export const updateInvoiceSchema = z.object({
    dueDate: z.coerce.date().optional().nullable(),
    notes: z.string().optional().nullable(),
    taxRate: z.coerce.number().min(0).max(100).optional(),
    lines: z.array(invoiceLineSchema).min(1).optional(),
});

export const paymentSchema = z.object({
    amount: z.coerce.number().positive('Amount must be positive'),
    method: z.nativeEnum(PaymentMethod),
    reference: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
});

export const invoiceQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    search: z.string().optional(),
    ticketId: z.string().optional(),
    customerId: z.string().optional(),
    quoteId: z.string().optional(),
    status: z.nativeEnum(InvoiceStatus).optional(),
});
