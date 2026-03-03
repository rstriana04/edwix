import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';

function dateFilter(from?: Date, to?: Date): Prisma.DateTimeFilter | undefined {
  if (!from && !to) return undefined;
  const filter: Prisma.DateTimeFilter = {};
  if (from) filter.gte = from;
  if (to) filter.lte = to;
  return filter;
}

export class ReportService {
  // ── Revenue Report ────────────────────────────

  async getRevenueReport(from?: Date, to?: Date, groupBy = 'month') {
    const dateCondition = dateFilter(from, to);
    const paymentWhere: Prisma.PaymentWhereInput = dateCondition
      ? { paidAt: dateCondition }
      : {};

    // Get all payments in range
    const payments = await prisma.payment.findMany({
      where: paymentWhere,
      select: { amount: true, method: true, paidAt: true },
      orderBy: { paidAt: 'asc' },
    });

    // Group by period
    const grouped = new Map<string, { totalRevenue: number; paymentCount: number; byMethod: Record<string, number> }>();

    for (const p of payments) {
      const date = new Date(p.paidAt);
      let periodKey: string;
      if (groupBy === 'day') {
        periodKey = date.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const d = new Date(date);
        d.setDate(d.getDate() - d.getDay());
        periodKey = d.toISOString().split('T')[0];
      } else {
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!grouped.has(periodKey)) {
        grouped.set(periodKey, { totalRevenue: 0, paymentCount: 0, byMethod: {} });
      }

      const entry = grouped.get(periodKey)!;
      const amount = Number(p.amount);
      entry.totalRevenue += amount;
      entry.paymentCount += 1;
      entry.byMethod[p.method] = (entry.byMethod[p.method] ?? 0) + amount;
    }

    const periods = Array.from(grouped.entries()).map(([period, data]) => ({
      period,
      ...data,
    }));

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      periods,
      summary: {
        totalRevenue,
        totalPayments: payments.length,
        averagePayment: payments.length > 0 ? totalRevenue / payments.length : 0,
      },
    };
  }

  // ── Ticket Stats ──────────────────────────────

  async getTicketStats(from?: Date, to?: Date) {
    const dateCondition = dateFilter(from, to);
    const ticketWhere: Prisma.TicketWhereInput = {
      deletedAt: null,
      ...(dateCondition ? { createdAt: dateCondition } : {}),
    };

    const tickets = await prisma.ticket.findMany({
      where: ticketWhere,
      select: {
        id: true,
        createdAt: true,
        status: { select: { name: true, isTerminal: true } },
      },
    });

    // By status
    const statusCounts = new Map<string, number>();
    let overdueCount = 0;
    const now = new Date();

    for (const t of tickets) {
      const statusName = t.status?.name ?? 'Unknown';
      statusCounts.set(statusName, (statusCounts.get(statusName) ?? 0) + 1);
    }

    // Overdue: tickets with estimatedDeliveryDate past and not terminal
    const overdueTickets = await prisma.ticket.count({
      where: {
        deletedAt: null,
        estimatedDeliveryDate: { lt: now },
        status: { isTerminal: false },
      },
    });
    overdueCount = overdueTickets;

    // Average resolution hours for terminal tickets
    const terminalTickets = await prisma.ticket.findMany({
      where: {
        deletedAt: null,
        status: { isTerminal: true },
        ...(dateCondition ? { createdAt: dateCondition } : {}),
      },
      select: { createdAt: true, updatedAt: true },
    });

    let averageResolutionHours = 0;
    if (terminalTickets.length > 0) {
      const totalHours = terminalTickets.reduce((sum, t) => {
        const diff = new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime();
        return sum + diff / (1000 * 60 * 60);
      }, 0);
      averageResolutionHours = Math.round((totalHours / terminalTickets.length) * 10) / 10;
    }

    const byStatus = Array.from(statusCounts.entries()).map(([status, count]) => ({
      status,
      count,
    }));

    return {
      totalTickets: tickets.length,
      byStatus,
      averageResolutionHours,
      overdueCount,
    };
  }

  // ── Technician Performance ────────────────────

  async getTechnicianPerformance(from?: Date, to?: Date) {
    const dateCondition = dateFilter(from, to);
    const ticketWhere: Prisma.TicketWhereInput = {
      deletedAt: null,
      assignedTechnicianId: { not: null },
      ...(dateCondition ? { createdAt: dateCondition } : {}),
    };

    const tickets = await prisma.ticket.findMany({
      where: ticketWhere,
      select: {
        assignedTechnicianId: true,
        assignedTechnician: { select: { id: true, firstName: true, lastName: true } },
        createdAt: true,
        updatedAt: true,
        status: { select: { isTerminal: true } },
        labor: { select: { minutes: true, ratePerHour: true } },
      },
    });

    const techMap = new Map<string, {
      id: string;
      name: string;
      assignedTickets: number;
      completedTickets: number;
      totalResolutionHours: number;
      totalLaborMinutes: number;
      totalLaborRevenue: number;
    }>();

    for (const t of tickets) {
      const techId = t.assignedTechnicianId!;
      if (!techMap.has(techId)) {
        techMap.set(techId, {
          id: techId,
          name: `${t.assignedTechnician?.firstName ?? ''} ${t.assignedTechnician?.lastName ?? ''}`.trim(),
          assignedTickets: 0,
          completedTickets: 0,
          totalResolutionHours: 0,
          totalLaborMinutes: 0,
          totalLaborRevenue: 0,
        });
      }

      const entry = techMap.get(techId)!;
      entry.assignedTickets += 1;

      if (t.status?.isTerminal) {
        entry.completedTickets += 1;
        const hours = (new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60);
        entry.totalResolutionHours += hours;
      }

      for (const labor of t.labor) {
        entry.totalLaborMinutes += labor.minutes;
        entry.totalLaborRevenue += (labor.minutes / 60) * Number(labor.ratePerHour);
      }
    }

    const technicians = Array.from(techMap.values()).map((t) => ({
      ...t,
      averageResolutionHours: t.completedTickets > 0
        ? Math.round((t.totalResolutionHours / t.completedTickets) * 10) / 10
        : 0,
      totalLaborRevenue: Math.round(t.totalLaborRevenue * 100) / 100,
    }));

    return { technicians };
  }

  // ── Inventory Analysis ────────────────────────

  async getInventoryAnalysis(lowStockOnly = false) {
    const parts = await prisma.part.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        sku: true,
        name: true,
        stockQuantity: true,
        minimumStock: true,
        costPrice: true,
        category: { select: { name: true } },
      },
    });

    const totalParts = parts.length;
    let totalValue = 0;
    const lowStockParts: { id: string; sku: string; name: string; stockQuantity: number; minimumStock: number }[] = [];
    const categoryMap = new Map<string, { count: number; value: number }>();

    for (const p of parts) {
      const value = p.stockQuantity * Number(p.costPrice);
      totalValue += value;

      if (p.stockQuantity <= p.minimumStock) {
        lowStockParts.push({
          id: p.id,
          sku: p.sku,
          name: p.name,
          stockQuantity: p.stockQuantity,
          minimumStock: p.minimumStock,
        });
      }

      const catName = p.category?.name ?? 'Sin categoría';
      if (!categoryMap.has(catName)) {
        categoryMap.set(catName, { count: 0, value: 0 });
      }
      const cat = categoryMap.get(catName)!;
      cat.count += 1;
      cat.value += value;
    }

    const byCategory = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      ...data,
      value: Math.round(data.value * 100) / 100,
    }));

    const result = {
      totalParts,
      totalValue: Math.round(totalValue * 100) / 100,
      lowStockParts,
      byCategory,
    };

    if (lowStockOnly) {
      return { ...result, byCategory: [] };
    }

    return result;
  }

  // ── Top Customers ─────────────────────────────

  async getTopCustomers(from?: Date, to?: Date, limit = 10) {
    const dateCondition = dateFilter(from, to);
    const invoiceWhere: Prisma.InvoiceWhereInput = {
      status: { in: ['PAID', 'PARTIAL'] },
      ...(dateCondition ? { createdAt: dateCondition } : {}),
    };

    const invoices = await prisma.invoice.findMany({
      where: invoiceWhere,
      select: {
        customerId: true,
        total: true,
        customer: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    const customerMap = new Map<string, { id: string; name: string; totalSpent: number; invoiceCount: number }>();

    for (const inv of invoices) {
      if (!customerMap.has(inv.customerId)) {
        customerMap.set(inv.customerId, {
          id: inv.customerId,
          name: `${inv.customer.firstName} ${inv.customer.lastName}`.trim(),
          totalSpent: 0,
          invoiceCount: 0,
        });
      }
      const entry = customerMap.get(inv.customerId)!;
      entry.totalSpent += Number(inv.total);
      entry.invoiceCount += 1;
    }

    const customers = Array.from(customerMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, limit)
      .map((c) => ({ ...c, totalSpent: Math.round(c.totalSpent * 100) / 100 }));

    return { customers };
  }

  // ── Parts Usage ───────────────────────────────

  async getPartsUsage(from?: Date, to?: Date, limit = 10) {
    const dateCondition = dateFilter(from, to);
    const movementWhere: Prisma.StockMovementWhereInput = {
      type: 'OUT',
      ...(dateCondition ? { createdAt: dateCondition } : {}),
    };

    const movements = await prisma.stockMovement.findMany({
      where: movementWhere,
      select: {
        partId: true,
        quantity: true,
        part: { select: { id: true, sku: true, name: true, salePrice: true } },
      },
    });

    const partMap = new Map<string, { id: string; sku: string; name: string; totalUsed: number; totalRevenue: number }>();

    for (const m of movements) {
      if (!partMap.has(m.partId)) {
        partMap.set(m.partId, {
          id: m.partId,
          sku: m.part.sku,
          name: m.part.name,
          totalUsed: 0,
          totalRevenue: 0,
        });
      }
      const entry = partMap.get(m.partId)!;
      entry.totalUsed += m.quantity;
      entry.totalRevenue += m.quantity * Number(m.part.salePrice);
    }

    const parts = Array.from(partMap.values())
      .sort((a, b) => b.totalUsed - a.totalUsed)
      .slice(0, limit)
      .map((p) => ({ ...p, totalRevenue: Math.round(p.totalRevenue * 100) / 100 }));

    return { parts };
  }

  // ── Summary ───────────────────────────────────

  async getSummary() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [monthPayments, openTickets] = await Promise.all([
      prisma.payment.aggregate({
        where: { paidAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.ticket.count({
        where: { deletedAt: null, status: { isTerminal: false } },
      }),
    ]);

    // Low stock: manually count since field comparison isn't straightforward
    const allParts = await prisma.part.findMany({
      where: { deletedAt: null },
      select: { stockQuantity: true, minimumStock: true },
    });
    const lowStock = allParts.filter((p) => p.stockQuantity <= p.minimumStock).length;

    return {
      monthlyRevenue: Number(monthPayments._sum.amount ?? 0),
      openTickets,
      lowStockCount: lowStock,
    };
  }
}

export const reportService = new ReportService();
