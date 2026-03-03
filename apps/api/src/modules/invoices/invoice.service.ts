import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../../config/database';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import { generateInvoiceNumber } from '../../utils/generators';
import { InvoiceStatus, QuoteStatus } from '@edwix/shared';

const invoiceInclude = {
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
    quote: { select: { id: true, quoteNumber: true, status: true } },
    lines: true,
    payments: {
        include: { receivedBy: { select: { id: true, firstName: true, lastName: true } } },
    },
};

async function getNextInvoiceSequence(): Promise<number> {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const key = `invoice_seq_${dateStr}`;
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

export class InvoiceService {
    async getInvoices(
        page: number,
        limit: number,
        search?: string,
        filters?: {
            ticketId?: string;
            customerId?: string;
            quoteId?: string;
            status?: InvoiceStatus;
        }
    ) {
        const skip = (page - 1) * limit;

        const where: Prisma.InvoiceWhereInput = {
            ...(filters?.ticketId ? { ticketId: filters.ticketId } : {}),
            ...(filters?.customerId ? { customerId: filters.customerId } : {}),
            ...(filters?.quoteId ? { quoteId: filters.quoteId } : {}),
            ...(filters?.status ? { status: filters.status } : {}),
            ...(search
                ? {
                    OR: [
                        { invoiceNumber: { contains: search, mode: 'insensitive' } },
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
            prisma.invoice.count({ where }),
            prisma.invoice.findMany({
                where,
                skip,
                take: limit,
                include: invoiceInclude,
                orderBy: { createdAt: 'desc' },
            }),
        ]);

        return { total, data };
    }

    async getInvoiceById(id: string) {
        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: invoiceInclude,
        });

        if (!invoice) {
            throw new NotFoundError('Invoice not found');
        }

        return invoice;
    }

    async createInvoice(data: {
        ticketId: string;
        quoteId?: string | null;
        dueDate?: Date | null;
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

        let linesToUse = data.lines;
        let quoteId: string | null = null;
        let taxRate = data.taxRate ?? 0;

        if (data.quoteId) {
            const quote = await prisma.quote.findUnique({
                where: { id: data.quoteId },
                include: { lines: true },
            });
            if (!quote) throw new NotFoundError('Quote not found');
            if (quote.ticketId !== data.ticketId || quote.customerId !== customerId) {
                throw new BadRequestError('Quote does not match ticket or customer');
            }
            quoteId = quote.id;
            linesToUse = quote.lines.map((l) => ({
                type: l.type,
                description: l.description,
                quantity: Number(l.quantity),
                unitPrice: Number(l.unitPrice),
                partId: l.partId,
            }));
            taxRate = Number(quote.taxRate);
        }

        const { subtotal, taxAmount, total } = computeTotals(
            linesToUse.map((l) => ({ quantity: l.quantity, unitPrice: l.unitPrice })),
            taxRate
        );

        const sequence = await getNextInvoiceSequence();
        const invoiceNumber = generateInvoiceNumber(sequence);

        const result = await prisma.$transaction(async (tx) => {
            const invoice = await tx.invoice.create({
                data: {
                    invoiceNumber,
                    quoteId,
                    ticketId: data.ticketId,
                    customerId,
                    status: InvoiceStatus.DRAFT,
                    subtotal: new Decimal(subtotal),
                    taxRate: new Decimal(taxRate),
                    taxAmount: new Decimal(taxAmount),
                    total: new Decimal(total),
                    dueDate: data.dueDate ?? null,
                    notes: data.notes ?? null,
                },
            });

            for (const line of linesToUse) {
                const lineTotal = line.quantity * line.unitPrice;
                await tx.invoiceLine.create({
                    data: {
                        invoiceId: invoice.id,
                        type: line.type as any,
                        description: line.description,
                        quantity: new Decimal(line.quantity),
                        unitPrice: new Decimal(line.unitPrice),
                        total: new Decimal(lineTotal),
                        partId: line.partId ?? null,
                    },
                });
            }

            if (quoteId) {
                await tx.quote.update({
                    where: { id: quoteId },
                    data: { status: QuoteStatus.INVOICED },
                });
            }

            return tx.invoice.findUnique({
                where: { id: invoice.id },
                include: invoiceInclude,
            });
        });

        if (!result) throw new NotFoundError('Invoice not found');
        return result;
    }

    async updateInvoice(
        id: string,
        data: {
            dueDate?: Date | null;
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
        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: { lines: true },
        });
        if (!invoice) throw new NotFoundError('Invoice not found');
        if (invoice.status !== InvoiceStatus.DRAFT) {
            throw new BadRequestError('Only draft invoices can be updated');
        }

        let subtotal = Number(invoice.subtotal);
        let taxRate = Number(invoice.taxRate);
        let taxAmount = Number(invoice.taxAmount);
        let total = Number(invoice.total);

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

        const result = await prisma.$transaction(async (tx) => {
            await tx.invoice.update({
                where: { id },
                data: {
                    dueDate: data.dueDate !== undefined ? data.dueDate : undefined,
                    notes: data.notes !== undefined ? data.notes : undefined,
                    subtotal: new Decimal(subtotal),
                    taxRate: new Decimal(taxRate),
                    taxAmount: new Decimal(taxAmount),
                    total: new Decimal(total),
                },
            });

            if (data.lines !== undefined) {
                await tx.invoiceLine.deleteMany({ where: { invoiceId: id } });
                for (const line of data.lines) {
                    const lineTotal = line.quantity * line.unitPrice;
                    await tx.invoiceLine.create({
                        data: {
                            invoiceId: id,
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

            return tx.invoice.findUnique({
                where: { id },
                include: invoiceInclude,
            });
        });

        return result!;
    }

    async addPayment(
        invoiceId: string,
        receivedById: string,
        data: {
            amount: number;
            method: string;
            reference?: string | null;
            notes?: string | null;
        }
    ) {
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { payments: true },
        });
        if (!invoice) throw new NotFoundError('Invoice not found');
        if (invoice.status === InvoiceStatus.PAID) {
            throw new BadRequestError('Invoice is already fully paid');
        }
        if (invoice.status === InvoiceStatus.CANCELLED) {
            throw new BadRequestError('Cannot add payment to cancelled invoice');
        }

        const invoiceTotal = Number(invoice.total);
        const paidSoFar = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const remaining = invoiceTotal - paidSoFar;
        if (data.amount > remaining) {
            throw new BadRequestError(
                `Payment amount (${data.amount}) exceeds remaining balance (${remaining})`
            );
        }

        const payment = await prisma.$transaction(async (tx) => {
            const p = await tx.payment.create({
                data: {
                    invoiceId,
                    amount: new Decimal(data.amount),
                    method: data.method as any,
                    reference: data.reference ?? null,
                    receivedById,
                    notes: data.notes ?? null,
                },
                include: { receivedBy: { select: { id: true, firstName: true, lastName: true } } },
            });

            const allPayments = await tx.payment.findMany({
                where: { invoiceId },
            });
            const totalPaid = allPayments.reduce((sum, x) => sum + Number(x.amount), 0);
            const newStatus =
                totalPaid >= invoiceTotal ? InvoiceStatus.PAID : InvoiceStatus.PARTIAL;
            await tx.invoice.update({
                where: { id: invoiceId },
                data: { status: newStatus },
            });

            return p;
        });

        return payment;
    }
}

export const invoiceService = new InvoiceService();
