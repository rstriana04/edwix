import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';

export class DeviceService {
    async getDevices(
        page: number,
        limit: number,
        search?: string,
        customerId?: string,
        categoryId?: string
    ) {
        const skip = (page - 1) * limit;

        const where: Prisma.DeviceWhereInput = {
            deletedAt: null,
            ...(customerId ? { customerId } : {}),
            ...(categoryId ? { categoryId } : {}),
            ...(search
                ? {
                    OR: [
                        { brand: { contains: search, mode: 'insensitive' } },
                        { model: { contains: search, mode: 'insensitive' } },
                        { serialNumber: { contains: search, mode: 'insensitive' } },
                        { imei: { contains: search } },
                    ],
                }
                : {}),
        };

        const [total, data] = await Promise.all([
            prisma.device.count({ where }),
            prisma.device.findMany({
                where,
                skip,
                take: limit,
                include: {
                    category: true,
                    customer: {
                        select: { id: true, firstName: true, lastName: true, phone: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
        ]);

        return { total, data };
    }

    async getDeviceById(id: string) {
        const device = await prisma.device.findFirst({
            where: { id, deletedAt: null },
            include: {
                category: true,
                customer: true,
                tickets: {
                    where: { deletedAt: null },
                    include: { status: true },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!device) {
            throw new NotFoundError('Device not found');
        }

        return device;
    }

    async createDevice(data: Prisma.DeviceUncheckedCreateInput) {
        // Ensure customer and category exist
        const customer = await prisma.customer.findFirst({
            where: { id: data.customerId, deletedAt: null },
        });
        if (!customer) throw new NotFoundError('Customer not found');

        const category = await prisma.deviceCategory.findUnique({
            where: { id: data.categoryId },
        });
        if (!category) throw new NotFoundError('Device category not found');

        return prisma.device.create({
            data,
            include: { category: true },
        });
    }

    async updateDevice(id: string, data: Prisma.DeviceUncheckedUpdateInput) {
        const device = await prisma.device.findFirst({
            where: { id, deletedAt: null },
        });

        if (!device) {
            throw new NotFoundError('Device not found');
        }

        return prisma.device.update({
            where: { id },
            data,
            include: { category: true },
        });
    }

    async deleteDevice(id: string) {
        const device = await prisma.device.findFirst({
            where: { id, deletedAt: null },
        });

        if (!device) {
            throw new NotFoundError('Device not found');
        }

        // Soft delete
        return prisma.device.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }

    // --- Device Categories ---
    async getCategories() {
        return prisma.deviceCategory.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
        });
    }
}

export const deviceService = new DeviceService();
