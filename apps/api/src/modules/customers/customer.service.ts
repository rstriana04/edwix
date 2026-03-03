import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';

export class CustomerService {
    async getCustomers(page: number, limit: number, search?: string) {
        const skip = (page - 1) * limit;

        const where: Prisma.CustomerWhereInput = {
            deletedAt: null,
            ...(search
                ? {
                    OR: [
                        { firstName: { contains: search, mode: 'insensitive' } },
                        { lastName: { contains: search, mode: 'insensitive' } },
                        { phone: { contains: search } },
                        { email: { contains: search, mode: 'insensitive' } },
                        { idDocument: { contains: search } },
                    ],
                }
                : {}),
        };

        const [total, data] = await Promise.all([
            prisma.customer.count({ where }),
            prisma.customer.findMany({
                where,
                skip,
                take: limit,
                orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
            }),
        ]);

        return { total, data };
    }

    async getCustomerById(id: string) {
        const customer = await prisma.customer.findFirst({
            where: { id, deletedAt: null },
            include: {
                devices: {
                    where: { deletedAt: null },
                    include: { category: true },
                },
                tickets: {
                    where: { deletedAt: null },
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
            },
        });

        if (!customer) {
            throw new NotFoundError('Customer not found');
        }

        return customer;
    }

    async createCustomer(data: Prisma.CustomerCreateInput) {
        return prisma.customer.create({
            data,
        });
    }

    async updateCustomer(id: string, data: Prisma.CustomerUpdateInput) {
        const customer = await prisma.customer.findFirst({
            where: { id, deletedAt: null },
        });

        if (!customer) {
            throw new NotFoundError('Customer not found');
        }

        return prisma.customer.update({
            where: { id },
            data,
        });
    }

    async deleteCustomer(id: string) {
        const customer = await prisma.customer.findFirst({
            where: { id, deletedAt: null },
        });

        if (!customer) {
            throw new NotFoundError('Customer not found');
        }

        // Soft delete
        return prisma.customer.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
}

export const customerService = new CustomerService();
