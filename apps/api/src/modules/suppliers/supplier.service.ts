import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';

export class SupplierService {
    async getSuppliers(page: number, limit: number, search?: string) {
        const skip = (page - 1) * limit;

        const where: Prisma.SupplierWhereInput = {
            deletedAt: null,
            ...(search
                ? {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { contactName: { contains: search, mode: 'insensitive' } },
                        { phone: { contains: search } },
                        { email: { contains: search, mode: 'insensitive' } },
                    ],
                }
                : {}),
        };

        const [total, data] = await Promise.all([
            prisma.supplier.count({ where }),
            prisma.supplier.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: 'asc' },
            }),
        ]);

        return { total, data };
    }

    async getSupplierById(id: string) {
        const supplier = await prisma.supplier.findFirst({
            where: { id, deletedAt: null },
        });

        if (!supplier) {
            throw new NotFoundError('Supplier not found');
        }

        return supplier;
    }

    async createSupplier(data: Prisma.SupplierCreateInput) {
        return prisma.supplier.create({
            data,
        });
    }

    async updateSupplier(id: string, data: Prisma.SupplierUpdateInput) {
        const supplier = await prisma.supplier.findFirst({
            where: { id, deletedAt: null },
        });

        if (!supplier) {
            throw new NotFoundError('Supplier not found');
        }

        return prisma.supplier.update({
            where: { id },
            data,
        });
    }

    async deleteSupplier(id: string) {
        const supplier = await prisma.supplier.findFirst({
            where: { id, deletedAt: null },
        });

        if (!supplier) {
            throw new NotFoundError('Supplier not found');
        }

        return prisma.supplier.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
}

export const supplierService = new SupplierService();
