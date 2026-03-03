import { z } from 'zod';
import { PartType, PartUnit, StockMovementType } from '@edwix/shared';

export const partCategoryBaseSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    parentId: z.string().optional().nullable(),
});

export const createPartCategorySchema = partCategoryBaseSchema;
export const updatePartCategorySchema = partCategoryBaseSchema.partial();

export const partBaseSchema = z.object({
    sku: z.string().optional(),
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional().nullable(),
    type: z.nativeEnum(PartType),
    categoryId: z.string().optional().nullable(),
    photos: z.array(z.string()).optional().default([]),
    unit: z.nativeEnum(PartUnit).optional().default(PartUnit.PCS),
    costPrice: z.coerce.number().min(0),
    salePrice: z.coerce.number().min(0),
    minimumStock: z.coerce.number().min(0).optional().default(0),
    storageLocation: z.string().optional().nullable(),
    compatibleBrands: z.array(z.string()).optional().default([]),
    compatibleModels: z.array(z.string()).optional().default([]),
    specifications: z.record(z.unknown()).optional().nullable(),
});

export const createPartSchema = partBaseSchema;
export const updatePartSchema = partBaseSchema.partial().extend({
    stockQuantity: z.coerce.number().min(0).optional(),
});

export const partQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    search: z.string().optional(),
    categoryId: z.string().optional(),
    type: z.nativeEnum(PartType).optional(),
});

export const stockMovementSchema = z.object({
    type: z.nativeEnum(StockMovementType),
    quantity: z.coerce.number().int().min(0),
    reason: z.string().optional().nullable(),
    referenceType: z.string().optional().nullable(),
    referenceId: z.string().optional().nullable(),
});

export const stockMovementQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
});
