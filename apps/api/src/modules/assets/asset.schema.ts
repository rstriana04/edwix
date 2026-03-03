import { z } from 'zod';
import { AssetStatus } from '@edwix/shared';

export const assetQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.nativeEnum(AssetStatus).optional(),
  category: z.string().optional(),
});

export const createAssetSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  serialNumber: z.string().optional().nullable(),
  purchaseDate: z.coerce.date().optional().nullable(),
  purchaseCost: z.coerce.number().min(0).optional().nullable(),
  warrantyExpiry: z.coerce.date().optional().nullable(),
  location: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  photos: z.array(z.string()).optional().default([]),
});

export const updateAssetSchema = createAssetSchema.partial().extend({
  status: z.nativeEnum(AssetStatus).optional(),
});

export const checkoutSchema = z.object({
  checkedOutToId: z.string().min(1, 'User is required'),
  notes: z.string().optional().nullable(),
});

export const checkinSchema = z.object({
  notes: z.string().optional().nullable(),
});

export const maintenanceSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  cost: z.coerce.number().min(0).optional().nullable(),
  performedAt: z.coerce.date().optional(),
  nextMaintenanceDate: z.coerce.date().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const subResourceQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});
