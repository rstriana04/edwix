import { z } from 'zod';

export const supplierBaseSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    contactName: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    email: z.string().email('Invalid email').optional().nullable(),
    website: z
        .union([z.string().url('Invalid URL'), z.literal('')])
        .optional()
        .nullable(),
    address: z.string().optional().nullable(),
    paymentTerms: z.string().optional().nullable(),
    deliveryNotes: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
});

export const createSupplierSchema = supplierBaseSchema;
export const updateSupplierSchema = supplierBaseSchema.partial();

export const supplierQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    search: z.string().optional(),
});
