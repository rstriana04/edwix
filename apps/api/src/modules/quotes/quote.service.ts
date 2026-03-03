import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../../config/database';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import { generateQuoteNumber } from '../../utils/generators';
import { QuoteStatus } from '@edwix/shared';

const quoteInclude = {
    ticket: {
        select: {
            id: true,
            ticketNumber: true,
            status: true,
            device: { select: { id: true, brand: true, model: true } },
        },
    },
    customer: {
        select: { id: true, firstName: true, lastName: true, phone: true, email: true },
    },
    lines: true,
};

async function getNextQuoteSequence(): Promise<number> {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const key = `quote_seq_${dateStr}`;
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

function computeTotals(
    lines: Array<{ quantity: number; unitPrice: number }>,
    taxRate: number
): { subtotal: number; taxAmount: number; total: number } {
    const subtotal = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
}

export class QuoteService {
    async getQuotes(
        page: number,
        limit: number,
        search?: string,
        filters?: { ticketId?: string; customerId?: string; status?: QuoteStatus }
    ) {
        const skip = (page - 1) * limit;

        const where: Prisma.QuoteWhereInput = {
            ...(filters?.ticketId ? { ticketId: filters.ticketId } : {}),
            ...(filters?.customerId ? { customerId: filters.customerId } : {}),
            ...(filters?.status ? { status: filters.status } : {}),
            ...(search
                ? {
                    OR: [
                        { quoteNumber: { contains: search, mode: 'insensitive' } },
                        {
                            customer: {
                                OR: [
                                    { firstName: { contains: search, mode: 'insensitive' } },
                                    { lastName: { contains: search, mode: 'insensitive' } },
                                ],
                            },
                        },
                    ],
                }
                : {}),
        };

        const [total, data] = await Promise.all([
            prisma.quote.count({ where }),
            prisma.quote.findMany({
                where,
                skip,
                take: limit,
                include: quoteInclude,
                orderBy: { createdAt: 'desc' },
            }),
        ]);

        return { total, data };
    }

    async getQuoteById(id: string) {
        const quote = await prisma.quote.findUnique({
            where: { id },
            include: {
                ...quoteInclude,
                lines: true,
                ticket: {
                    include: { device: { include: { category: true } }, status: true },
                },
            },
        });

        if (!quote) {
            throw new NotFoundError('Quote not found');
        }

        return quote;
    }

    async createQuote(data: {
        ticketId: string;
        validUntil?: Date | null;
        notes?: string | null;
        taxRate?: number;
        lines: Array<{
            type: string;
            description: string;
            quantity: number;
            unitPrice: number;
            partId?: string | null;
        }>;
    }) {
        const ticket = await prisma.ticket.findFirst({
            where: { id: data.ticketId, deletedAt: null },
        });
        if (!ticket) throw new NotFoundError('Ticket not found');

        const customerId = ticket.customerId;
        const customer = await prisma.customer.findFirst({
            where: { id: customerId, deletedAt: null },
        });
        if (!customer) throw new NotFoundError('Customer not found');

        const taxRate = data.taxRate ?? 0;
        const { subtotal, taxAmount, total } = computeTotals(
            data.lines.map((l) => ({ quantity: l.quantity, unitPrice: l.unitPrice })),
            taxRate
        );

        const sequence = await getNextQuoteSequence();
        const quoteNumber = generateQuoteNumber(sequence);

        const result = await prisma.$transaction(async (tx) => {
            const quote = await tx.quote.create({
                data: {
                    quoteNumber,
                    ticketId: data.ticketId,
                    customerId,
                    status: QuoteStatus.DRAFT,
                    subtotal: new Decimal(subtotal),
                    taxRate: new Decimal(taxRate),
                    taxAmount: new Decimal(taxAmount),
                    total: new Decimal(total),
                    notes: data.notes ?? null,
                    validUntil: data.validUntil ?? null,
                },
            });

            for (const line of data.lines) {
                const lineTotal = line.quantity * line.unitPrice;
                await tx.quoteLine.create({
                    data: {
                        quoteId: quote.id,
                        type: line.type as any,
                        description: line.description,
                        quantity: new Decimal(line.quantity),
                        unitPrice: new Decimal(line.unitPrice),
                        total: new Decimal(lineTotal),
                        partId: line.partId ?? null,
                    },
                });
            }

            return tx.quote.findUnique({
                where: { id: quote.id },
                include: quoteInclude,
            });
        });
        if (!result) throw new NotFoundError('Quote not found');
        return result;
    }

    async updateQuote(
        id: string,
        data: {
            validUntil?: Date | null;
            notes?: string | null;
            taxRate?: number;
            lines?: Array<{
                type: string;
                description: string;
                quantity: number;
                unitPrice: number;
                partId?: string | null;
            }>;
        }
    ) {
        const quote = await prisma.quote.findUnique({
            where: { id },
            include: { lines: true },
        });
        if (!quote) throw new NotFoundError('Quote not found');
        if (quote.status !== QuoteStatus.DRAFT) {
            throw new BadRequestError('Only draft quotes can be updated');
        }

        let subtotal = Number(quote.subtotal);
        let taxRate = Number(quote.taxRate);
        let taxAmount = Number(quote.taxAmount);
        let total = Number(quote.total);

        if (data.lines !== undefined) {
            const computed = computeTotals(
                data.lines.map((l) => ({ quantity: l.quantity, unitPrice: l.unitPrice })),
                data.taxRate ?? taxRate
            );
            subtotal = computed.subtotal;
            taxRate = data.taxRate ?? taxRate;
            taxAmount = computed.taxAmount;
            total = computed.total;
        } else if (data.taxRate !== undefined) {
            taxRate = data.taxRate;
            taxAmount = (subtotal * taxRate) / 100;
            total = subtotal + taxAmount;
        }

        return prisma.$transaction(async (tx) => {
            await tx.quote.update({
                where: { id },
                data: {
                    validUntil: data.validUntil !== undefined ? data.validUntil : undefined,
                    notes: data.notes !== undefined ? data.notes : undefined,
                    subtotal: new Decimal(subtotal),
                    taxRate: new Decimal(taxRate),
                    taxAmount: new Decimal(taxAmount),
                    total: new Decimal(total),
                },
            });

            if (data.lines !== undefined) {
                await tx.quoteLine.deleteMany({ where: { quoteId: id } });
                for (const line of data.lines) {
                    const lineTotal = line.quantity * line.unitPrice;
                    await tx.quoteLine.create({
                        data: {
                            quoteId: id,
                            type: line.type as any,
                            description: line.description,
                            quantity: new Decimal(line.quantity),
                            unitPrice: new Decimal(line.unitPrice),
                            total: new Decimal(lineTotal),
                            partId: line.partId ?? null,
                        },
                    });
                }
            }

            return tx.quote.findUnique({
                where: { id },
                include: quoteInclude,
            });
        });
    }

    async updateQuoteStatus(id: string, status: QuoteStatus) {
        const quote = await prisma.quote.findUnique({
            where: { id },
            include: { invoices: true },
        });
        if (!quote) throw new NotFoundError('Quote not found');

        if (status === QuoteStatus.INVOICED) {
            const hasInvoice = quote.invoices && quote.invoices.length > 0;
            if (!hasInvoice) {
                throw new BadRequestError(
                    'Quote can only be marked INVOICED when linked to an invoice'
                );
            }
        }

        return prisma.quote.update({
            where: { id },
            data: { status },
            include: quoteInclude,
        });
    }

    async deleteQuote(id: string) {
        const quote = await prisma.quote.findUnique({
            where: { id },
        });
        if (!quote) throw new NotFoundError('Quote not found');
        if (quote.status !== QuoteStatus.DRAFT) {
            throw new BadRequestError('Only draft quotes can be deleted');
        }

        await prisma.quote.delete({
            where: { id },
        });
    }
}

export const quoteService = new QuoteService();
