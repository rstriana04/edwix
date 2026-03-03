import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../../config/database';
import { NotFoundError, BadRequestError, ConflictError } from '../../utils/errors';
import { generateSKU } from '../../utils/generators';
import { StockMovementType } from '@edwix/shared';

const partInclude = {
    category: true,
};

export class PartService {
    async getCategories(parentId?: string | null) {
        const where: Prisma.PartCategoryWhereInput = parentId === undefined
            ? {}
            : { parentId: parentId ?? null };
        return prisma.partCategory.findMany({
            where,
            orderBy: { name: 'asc' },
            include: { parent: true },
        });
    }

    async getCategoryById(id: string) {
        const category = await prisma.partCategory.findUnique({
            where: { id },
            include: { parent: true, children: true },
        });
        if (!category) throw new NotFoundError('Part category not found');
        return category;
    }

    async createCategory(data: Prisma.PartCategoryUncheckedCreateInput) {
        if (data.parentId) {
            const parent = await prisma.partCategory.findUnique({
                where: { id: data.parentId },
            });
            if (!parent) throw new NotFoundError('Parent category not found');
        }
        return prisma.partCategory.create({ data });
    }

    async updateCategory(id: string, data: Prisma.PartCategoryUpdateInput) {
        const category = await prisma.partCategory.findUnique({ where: { id } });
        if (!category) throw new NotFoundError('Part category not found');
        return prisma.partCategory.update({ where: { id }, data });
    }

    async getParts(
        page: number,
        limit: number,
        search?: string,
        categoryId?: string,
        type?: string
    ) {
        const skip = (page - 1) * limit;

        const where: Prisma.PartWhereInput = {
            deletedAt: null,
            ...(categoryId ? { categoryId } : {}),
            ...(type ? { type: type as Prisma.EnumPartTypeFilter } : {}),
            ...(search
                ? {
                    OR: [
                        { sku: { contains: search, mode: 'insensitive' } },
                        { name: { contains: search, mode: 'insensitive' } },
                        { description: { contains: search, mode: 'insensitive' } },
                    ],
                }
                : {}),
        };

        const [total, data] = await Promise.all([
            prisma.part.count({ where }),
            prisma.part.findMany({
                where,
                skip,
                take: limit,
                include: partInclude,
                orderBy: { name: 'asc' },
            }),
        ]);

        return { total, data };
    }

    async getPartById(id: string, includeMovements = false) {
        const part = await prisma.part.findFirst({
            where: { id, deletedAt: null },
            include: {
                ...partInclude,
                ...(includeMovements
                    ? {
                        stockMovements: {
                            include: { user: { select: { id: true, firstName: true, lastName: true } } },
                            orderBy: { createdAt: 'desc' },
                            take: 20,
                        },
                    }
                    : {}),
            },
        });
        if (!part) throw new NotFoundError('Part not found');
        return part;
    }

    async createPart(data: Prisma.PartUncheckedCreateInput) {
        if (data.categoryId) {
            const category = await prisma.partCategory.findUnique({
                where: { id: data.categoryId },
            });
            if (!category) throw new NotFoundError('Part category not found');
        }

        let sku = data.sku as string | undefined;
        if (!sku || !sku.trim()) {
            const prefix = (data.categoryId
                ? (await prisma.partCategory.findUnique({ where: { id: data.categoryId } }))?.name?.slice(0, 4).toUpperCase().replace(/\s/g, '') || 'PART'
                : 'PART');
            sku = generateSKU(prefix);
            let exists = await prisma.part.findUnique({ where: { sku } });
            let attempts = 0;
            while (exists && attempts < 5) {
                sku = generateSKU(prefix);
                exists = await prisma.part.findUnique({ where: { sku } });
                attempts++;
            }
            if (exists) throw new ConflictError('Could not generate unique SKU');
        } else {
            const existing = await prisma.part.findUnique({ where: { sku } });
            if (existing) throw new ConflictError('Part with this SKU already exists');
        }

        const createData = {
            ...data,
            sku,
            costPrice: new Decimal(data.costPrice as any),
            salePrice: new Decimal(data.salePrice as any),
            photos: data.photos ?? [],
            compatibleBrands: data.compatibleBrands ?? [],
            compatibleModels: data.compatibleModels ?? [],
        };

        return prisma.part.create({
            data: createData,
            include: partInclude,
        });
    }

    async updatePart(id: string, data: Prisma.PartUncheckedUpdateInput) {
        const part = await prisma.part.findFirst({
            where: { id, deletedAt: null },
        });
        if (!part) throw new NotFoundError('Part not found');

        const newStock = data.stockQuantity !== undefined ? Number(data.stockQuantity) : undefined;
        if (newStock !== undefined && newStock < part.stockQuantity) {
            throw new BadRequestError(
                'Cannot reduce stock via update; use a stock movement (OUT or ADJUSTMENT) instead'
            );
        }

        if (data.sku && data.sku !== part.sku) {
            const existing = await prisma.part.findUnique({ where: { sku: data.sku as string } });
            if (existing) throw new ConflictError('Part with this SKU already exists');
        }

        const updateData = { ...data };
        if (data.costPrice !== undefined) updateData.costPrice = new Decimal(data.costPrice as any);
        if (data.salePrice !== undefined) updateData.salePrice = new Decimal(data.salePrice as any);

        return prisma.part.update({
            where: { id },
            data: updateData,
            include: partInclude,
        });
    }

    async deletePart(id: string) {
        const part = await prisma.part.findFirst({
            where: { id, deletedAt: null },
        });
        if (!part) throw new NotFoundError('Part not found');
        return prisma.part.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }

    async createStockMovement(
        partId: string,
        userId: string,
        data: {
            type: StockMovementType;
            quantity: number;
            reason?: string | null;
            referenceType?: string | null;
            referenceId?: string | null;
        }
    ) {
        const part = await prisma.part.findFirst({
            where: { id: partId, deletedAt: null },
        });
        if (!part) throw new NotFoundError('Part not found');

        const qty = data.quantity;
        const currentStock = part.stockQuantity;

        let newQuantity: number;
        let movementQuantity: number;

        if (data.type === StockMovementType.IN) {
            newQuantity = currentStock + qty;
            movementQuantity = qty;
        } else if (data.type === StockMovementType.OUT) {
            if (qty > currentStock) {
                throw new BadRequestError(
                    `Insufficient stock. Current: ${currentStock}, requested: ${qty}`
                );
            }
            newQuantity = currentStock - qty;
            movementQuantity = qty;
        } else {
            if (qty < 0) {
                throw new BadRequestError('Adjusted quantity cannot be negative');
            }
            newQuantity = qty;
            movementQuantity = qty;
        }

        const [updated, movement] = await prisma.$transaction([
            prisma.part.update({
                where: { id: partId },
                data: { stockQuantity: newQuantity },
            }),
            prisma.stockMovement.create({
                data: {
                    partId,
                    userId,
                    type: data.type,
                    quantity: movementQuantity,
                    reason: data.reason ?? null,
                    referenceType: data.referenceType ?? null,
                    referenceId: data.referenceId ?? null,
                },
                include: { user: { select: { id: true, firstName: true, lastName: true } } },
            }),
        ]);

        return { part: updated, movement };
    }

    async getStockMovements(partId: string, page: number, limit: number) {
        const part = await prisma.part.findFirst({
            where: { id: partId, deletedAt: null },
        });
        if (!part) throw new NotFoundError('Part not found');

        const skip = (page - 1) * limit;
        const [total, data] = await Promise.all([
            prisma.stockMovement.count({ where: { partId } }),
            prisma.stockMovement.findMany({
                where: { partId },
                skip,
                take: limit,
                include: { user: { select: { id: true, firstName: true, lastName: true } } },
                orderBy: { createdAt: 'desc' },
            }),
        ]);

        return { total, data };
    }
}

export const partService = new PartService();
