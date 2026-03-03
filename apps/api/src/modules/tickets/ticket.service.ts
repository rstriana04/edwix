import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { NotFoundError, BadRequestError, ConflictError } from '../../utils/errors';
import { generateTicketNumber, generatePublicAccessCode } from '../../utils/generators';

const ticketInclude = {
    customer: {
        select: { id: true, firstName: true, lastName: true, phone: true, email: true },
    },
    device: { include: { category: true } },
    status: true,
    assignedTechnician: {
        select: { id: true, firstName: true, lastName: true, email: true },
    },
};

async function getNextTicketSequence(): Promise<number> {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const key = `ticket_seq_${dateStr}`;
    return prisma.$transaction(async (tx) => {
        const s = await tx.setting.upsert({
            where: { key },
            create: { key, value: '0' },
            update: {},
        });
        const next = parseInt(s.value, 10) + 1;
        await tx.setting.update({
            where: { key },
            data: { value: String(next) },
        });
        return next;
    });
}

async function ensureUniquePublicAccessCode(): Promise<string> {
    for (let i = 0; i < 5; i++) {
        const code = generatePublicAccessCode();
        const existing = await prisma.ticket.findUnique({
            where: { publicAccessCode: code },
        });
        if (!existing) return code;
    }
    throw new ConflictError('Could not generate unique access code');
}

export class TicketService {
    async getStatuses() {
        return prisma.ticketStatus.findMany({
            orderBy: { sortOrder: 'asc' },
        });
    }

    async getTickets(
        page: number,
        limit: number,
        search?: string,
        filters?: {
            customerId?: string;
            deviceId?: string;
            statusId?: string;
            assignedTechnicianId?: string;
        }
    ) {
        const skip = (page - 1) * limit;

        const where: Prisma.TicketWhereInput = {
            deletedAt: null,
            ...(filters?.customerId ? { customerId: filters.customerId } : {}),
            ...(filters?.deviceId ? { deviceId: filters.deviceId } : {}),
            ...(filters?.statusId ? { statusId: filters.statusId } : {}),
            ...(filters?.assignedTechnicianId
                ? { assignedTechnicianId: filters.assignedTechnicianId }
                : {}),
            ...(search
                ? {
                    OR: [
                        { ticketNumber: { contains: search, mode: 'insensitive' } },
                        { publicAccessCode: { contains: search, mode: 'insensitive' } },
                        {
                            customer: {
                                OR: [
                                    { firstName: { contains: search, mode: 'insensitive' } },
                                    { lastName: { contains: search, mode: 'insensitive' } },
                                ],
                            },
                        },
                        { device: { brand: { contains: search, mode: 'insensitive' } } },
                        { device: { model: { contains: search, mode: 'insensitive' } } },
                    ],
                }
                : {}),
        };

        const [total, data] = await Promise.all([
            prisma.ticket.count({ where }),
            prisma.ticket.findMany({
                where,
                skip,
                take: limit,
                include: ticketInclude,
                orderBy: { createdAt: 'desc' },
            }),
        ]);

        return { total, data };
    }

    async getTicketById(id: string, includeSubResources = false) {
        const ticket = await prisma.ticket.findFirst({
            where: { id, deletedAt: null },
            include: {
                ...ticketInclude,
                ...(includeSubResources
                    ? {
                        notes: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
                        statusChanges: {
                            include: {
                                fromStatus: true,
                                toStatus: true,
                                changedBy: { select: { id: true, firstName: true, lastName: true } },
                            },
                            orderBy: { createdAt: 'desc' },
                        },
                    }
                    : {}),
            },
        });

        if (!ticket) {
            throw new NotFoundError('Ticket not found');
        }

        return ticket;
    }

    async createTicket(data: Prisma.TicketUncheckedCreateInput) {
        const customer = await prisma.customer.findFirst({
            where: { id: data.customerId, deletedAt: null },
        });
        if (!customer) throw new NotFoundError('Customer not found');

        const device = await prisma.device.findFirst({
            where: { id: data.deviceId, deletedAt: null },
        });
        if (!device) throw new NotFoundError('Device not found');
        if (device.customerId !== data.customerId) {
            throw new BadRequestError('Device does not belong to the selected customer');
        }

        const defaultStatus = await prisma.ticketStatus.findFirst({
            where: { isDefault: true },
        });
        if (!defaultStatus) throw new BadRequestError('No default ticket status configured');

        const sequence = await getNextTicketSequence();
        const ticketNumber = generateTicketNumber(sequence);
        const publicAccessCode = await ensureUniquePublicAccessCode();

        return prisma.ticket.create({
            data: {
                ...data,
                ticketNumber,
                publicAccessCode,
                statusId: defaultStatus.id,
                accessoriesReceived: data.accessoriesReceived ?? [],
                damagePhotos: data.damagePhotos ?? [],
            },
            include: ticketInclude,
        });
    }

    async updateTicket(id: string, userId: string, data: Prisma.TicketUncheckedUpdateInput) {
        const ticket = await prisma.ticket.findFirst({
            where: { id, deletedAt: null },
        });

        if (!ticket) {
            throw new NotFoundError('Ticket not found');
        }

        const previousStatusId = ticket.statusId;
        const newStatusId = data.statusId as string | undefined;

        if (newStatusId && newStatusId !== previousStatusId) {
            const toStatus = await prisma.ticketStatus.findUnique({
                where: { id: newStatusId },
            });
            if (!toStatus) throw new NotFoundError('Ticket status not found');
        }

        if (data.assignedTechnicianId !== undefined && data.assignedTechnicianId !== null) {
            const tech = await prisma.user.findUnique({
                where: { id: data.assignedTechnicianId as string },
            });
            if (!tech) throw new NotFoundError('Assigned technician not found');
        }

        const [updated] = await prisma.$transaction([
            prisma.ticket.update({
                where: { id },
                data: {
                    ...data,
                    accessoriesReceived: data.accessoriesReceived ?? undefined,
                    damagePhotos: data.damagePhotos ?? undefined,
                },
                include: ticketInclude,
            }),
            ...(newStatusId && newStatusId !== previousStatusId
                ? [
                    prisma.ticketStatusChange.create({
                        data: {
                            ticketId: id,
                            fromStatusId: previousStatusId,
                            toStatusId: newStatusId,
                            changedById: userId,
                        },
                    }),
                ]
                : []),
        ]);

        return updated;
    }

    async deleteTicket(id: string) {
        const ticket = await prisma.ticket.findFirst({
            where: { id, deletedAt: null },
        });

        if (!ticket) {
            throw new NotFoundError('Ticket not found');
        }

        return prisma.ticket.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }

    async addNote(ticketId: string, userId: string, content: string, isPublic = false) {
        const ticket = await prisma.ticket.findFirst({
            where: { id: ticketId, deletedAt: null },
        });
        if (!ticket) throw new NotFoundError('Ticket not found');

        return prisma.ticketNote.create({
            data: { ticketId, userId, content, isPublic },
            include: { user: { select: { id: true, firstName: true, lastName: true } } },
        });
    }
}

export const ticketService = new TicketService();
