import { z } from 'zod';

export const updateBusinessProfileSchema = z.object({
  name: z.string().min(1, 'Business name is required'),
  logo: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email('Invalid email').optional().nullable(),
  taxId: z.string().optional().nullable(),
  footerText: z.string().optional().nullable(),
  currency: z.string().min(1).default('COP'),
});

export const createLaborRateSchema = z.object({
  deviceCategoryId: z.string().min(1, 'Device category is required'),
  description: z.string().min(1, 'Description is required'),
  ratePerHour: z.coerce.number().min(0, 'Rate must be non-negative'),
});

export const updateLaborRateSchema = createLaborRateSchema.partial();

export const upsertSettingSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  value: z.string().min(1, 'Value is required'),
});

export const settingQuerySchema = z.object({
  prefix: z.string().optional(),
});
