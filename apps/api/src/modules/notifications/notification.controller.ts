import { Request, Response, NextFunction } from 'express';
import { notificationService } from './notification.service';
import { sendSuccess, sendPaginated, sendCreated, sendNoContent } from '../../utils/response';

// ── Templates ───────────────────────────────────

export const listTemplates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, channel, event } = req.query as Record<string, string | undefined>;
    const { total, data } = await notificationService.listTemplates(
      Number(page),
      Number(limit),
      channel as any,
      event,
    );
    sendPaginated(res, data, total, Number(page), Number(limit));
  } catch (error) {
    next(error);
  }
};

export const getTemplateById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const template = await notificationService.getTemplateById(req.params.id);
    sendSuccess(res, template);
  } catch (error) {
    next(error);
  }
};

export const createTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const template = await notificationService.createTemplate(req.body);
    sendCreated(res, template, 'Template created successfully');
  } catch (error) {
    next(error);
  }
};

export const updateTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const template = await notificationService.updateTemplate(req.params.id, req.body);
    sendSuccess(res, template, 'Template updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await notificationService.deleteTemplate(req.params.id);
    sendNoContent(res);
  } catch (error) {
    next(error);
  }
};

// ── Alerts ──────────────────────────────────────

export const listAlerts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, isRead, type } = req.query as Record<string, string | undefined>;
    const userId = req.user!.role === 'ADMIN' && req.query.userId
      ? req.query.userId as string
      : req.user!.sub;

    const { total, data } = await notificationService.listAlerts(
      userId,
      Number(page) || 1,
      Number(limit) || 20,
      isRead as unknown as boolean | undefined,
      type as any,
    );
    sendPaginated(res, data, total, Number(page) || 1, Number(limit) || 20);
  } catch (error) {
    next(error);
  }
};

export const createAlert = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alert = await notificationService.createAlert(req.body);
    sendCreated(res, alert, 'Alert created successfully');
  } catch (error) {
    next(error);
  }
};

export const markAlertsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await notificationService.markAlertsRead(req.body.alertIds, req.user!.sub);
    sendSuccess(res, result, 'Alerts marked as read');
  } catch (error) {
    next(error);
  }
};

export const getUnreadAlertCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await notificationService.getUnreadCount(req.user!.sub);
    sendSuccess(res, { count });
  } catch (error) {
    next(error);
  }
};

// ── Logs ────────────────────────────────────────

export const listLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, channel, status } = req.query as Record<string, string | undefined>;
    const { total, data } = await notificationService.listLogs(
      Number(page) || 1,
      Number(limit) || 20,
      channel as any,
      status as any,
    );
    sendPaginated(res, data, total, Number(page) || 1, Number(limit) || 20);
  } catch (error) {
    next(error);
  }
};

// ── Send ────────────────────────────────────────

export const sendNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const log = await notificationService.sendNotification(req.body.templateId, {
      ticketId: req.body.ticketId,
      customerId: req.body.customerId,
      variables: req.body.variables,
    });
    sendCreated(res, log, 'Notification sent successfully');
  } catch (error) {
    next(error);
  }
};
