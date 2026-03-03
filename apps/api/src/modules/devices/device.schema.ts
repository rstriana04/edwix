import { z } from 'zod';

export const deviceBaseSchema = z.object({
    customerId: z.string().min(1, 'Customer ID is required'),
    categoryId: z.string().min(1, 'Category ID is required'),
    brand: z.string().min(1, 'Brand is required'),
    model: z.string().min(1, 'Model is required'),
    serialNumber: z.string().optional().nullable(),
    color: z.string().optional().nullable(),
    imei: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    photos: z.array(z.string()).optional().default([]),
});

export const createDeviceSchema = deviceBaseSchema;

export const updateDeviceSchema = deviceBaseSchema.partial();

export const deviceQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    search: z.string().optional(),
    customerId: z.string().optional(),
    categoryId: z.string().optional(),
});
