import { prisma } from '../../config/database';

interface DashboardIndicators {
  openTickets: number;
  overdueTickets: number;
  readyForDeliveryTickets: number;
  averageRepairHours: number;
}

async function getDeliveredStatusIds(): Promise<string[]> {
  const statuses = await prisma.ticketStatus.findMany({
    where: { name: { in: ['Entregado', 'Delivered'] } },
    select: { id: true },
  });
  return statuses.map((status) => status.id);
}

async function getAverageRepairHours(deliveredStatusIds: string[]): Promise<number> {
  if (!deliveredStatusIds.length) return 0;
  const deliveredTickets = await prisma.ticket.findMany({
    where: { deletedAt: null, statusId: { in: deliveredStatusIds } },
    select: { createdAt: true, updatedAt: true },
  });
  if (!deliveredTickets.length) return 0;
  const totalHours = deliveredTickets.reduce((sum, ticket) => {
    const diffMs = ticket.updatedAt.getTime() - ticket.createdAt.getTime();
    return sum + Math.max(diffMs / (1000 * 60 * 60), 0);
  }, 0);
  return Number((totalHours / deliveredTickets.length).toFixed(2));
}

export class DashboardService {
  async getIndicators(): Promise<DashboardIndicators> {
    const now = new Date();
    const deliveredStatusIds = await getDeliveredStatusIds();
    const [openTickets, overdueTickets, readyForDeliveryTickets, averageRepairHours] = await Promise.all([
      prisma.ticket.count({ where: { deletedAt: null, status: { isTerminal: false } } }),
      prisma.ticket.count({
        where: {
          deletedAt: null,
          estimatedDeliveryDate: { lt: now },
          status: { isTerminal: false },
        },
      }),
      prisma.ticket.count({
        where: {
          deletedAt: null,
          status: { name: { in: ['Listo para entrega', 'Ready for delivery'] } },
        },
      }),
      getAverageRepairHours(deliveredStatusIds),
    ]);

    return {
      openTickets,
      overdueTickets,
      readyForDeliveryTickets,
      averageRepairHours,
    };
  }
}

export const dashboardService = new DashboardService();
