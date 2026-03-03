import { z } from 'zod';

export const customerBaseSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    phone: z.string().min(1, 'Phone number is required'),
    email: z.string().email('Invalid email address').optional().nullable(),
    idDocument: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
});

export const createCustomerSchema = customerBaseSchema;

export const updateCustomerSchema = customerBaseSchema.partial();

export const customerQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    search: z.string().optional(),
});
