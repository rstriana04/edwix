import { Prisma, NotificationChannel, AlertType, NotificationStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { NotFoundError, ConflictError } from '../../utils/errors';

export class NotificationService {
  // ── Templates ─────────────────────────────────

  async listTemplates(
    page: number,
    limit: number,
    channel?: NotificationChannel,
    event?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationTemplateWhereInput = {
      ...(channel ? { channel } : {}),
      ...(event ? { event: { contains: event, mode: 'insensitive' } } : {}),
    };

    const [total, data] = await Promise.all([
      prisma.notificationTemplate.count({ where }),
      prisma.notificationTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { event: 'asc' },
      }),
    ]);

    return { total, data };
  }

  async getTemplateById(id: string) {
    const template = await prisma.notificationTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundError('Notification template', id);
    return template;
  }

  async createTemplate(data: Prisma.NotificationTemplateCreateInput) {
    try {
      return await prisma.notificationTemplate.create({ data });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictError('A template for this event and channel already exists');
      }
      throw error;
    }
  }

  async updateTemplate(id: string, data: Prisma.NotificationTemplateUpdateInput) {
    const existing = await prisma.notificationTemplate.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Notification template', id);

    try {
      return await prisma.notificationTemplate.update({ where: { id }, data });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictError('A template for this event and channel already exists');
      }
      throw error;
    }
  }

  async deleteTemplate(id: string) {
    const existing = await prisma.notificationTemplate.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Notification template', id);
    return prisma.notificationTemplate.delete({ where: { id } });
  }

  // ── Internal Alerts ───────────────────────────

  async listAlerts(
    userId: string | null,
    page: number,
    limit: number,
    isRead?: boolean,
    type?: AlertType,
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.InternalAlertWhereInput = {
      ...(userId ? { userId } : {}),
      ...(isRead !== undefined ? { isRead } : {}),
      ...(type ? { type } : {}),
    };

    const [total, data] = await Promise.all([
      prisma.internalAlert.count({ where }),
      prisma.internalAlert.findMany({
        where,
        skip,
        take: limit,
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { total, data };
  }

  async createAlert(data: Prisma.InternalAlertUncheckedCreateInput) {
    return prisma.internalAlert.create({
      data,
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async markAlertsRead(alertIds: string[], userId: string) {
    const result = await prisma.internalAlert.updateMany({
      where: {
        id: { in: alertIds },
        userId,
      },
      data: { isRead: true },
    });
    return result;
  }

  async getUnreadCount(userId: string) {
    return prisma.internalAlert.count({
      where: { userId, isRead: false },
    });
  }

  // ── Notification Logs ─────────────────────────

  async listLogs(
    page: number,
    limit: number,
    channel?: NotificationChannel,
    status?: NotificationStatus,
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationLogWhereInput = {
      ...(channel ? { channel } : {}),
      ...(status ? { status } : {}),
    };

    const [total, data] = await Promise.all([
      prisma.notificationLog.count({ where }),
      prisma.notificationLog.findMany({
        where,
        skip,
        take: limit,
        include: {
          template: { select: { id: true, event: true, channel: true } },
          ticket: { select: { id: true, ticketNumber: true } },
          customer: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { total, data };
  }

  // ── Send Notification (stubbed) ───────────────

  async sendNotification(
    templateId: string,
    data: {
      ticketId?: string | null;
      customerId?: string | null;
      variables?: Record<string, string>;
    },
  ) {
    const template = await prisma.notificationTemplate.findUnique({ where: { id: templateId } });
    if (!template) throw new NotFoundError('Notification template', templateId);

    // Interpolate variables into body
    const variables = data.variables ?? {};
    const content = template.body.replace(
      /\{\{(\w+)\}\}/g,
      (_, key) => variables[key] ?? `{{${key}}}`,
    );

    // Create log entry
    const log = await prisma.notificationLog.create({
      data: {
        templateId,
        channel: template.channel,
        content,
        ticketId: data.ticketId ?? null,
        customerId: data.customerId ?? null,
        status: 'PENDING',
      },
    });

    // Stub: log to console and mark as sent
    console.log(`[Notification] Would send via ${template.channel}: ${content}`);

    const updated = await prisma.notificationLog.update({
      where: { id: log.id },
      data: { status: 'SENT', sentAt: new Date() },
    });

    return updated;
  }
}

export const notificationService = new NotificationService();
