import { z } from 'zod';

export const dateRangeSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const revenueQuerySchema = dateRangeSchema.extend({
  groupBy: z.enum(['day', 'week', 'month']).optional().default('month'),
});

export const ticketStatsQuerySchema = dateRangeSchema;

export const technicianQuerySchema = dateRangeSchema;

export const inventoryQuerySchema = z.object({
  lowStockOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
});

export const topCustomersQuerySchema = dateRangeSchema.extend({
  limit: z.coerce.number().min(1).max(50).optional().default(10),
});

export const partsUsageQuerySchema = dateRangeSchema.extend({
  limit: z.coerce.number().min(1).max(50).optional().default(10),
});
