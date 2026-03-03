import { Router } from 'express';
import {
  listTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  listAlerts,
  createAlert,
  markAlertsRead,
  getUnreadAlertCount,
  listLogs,
  sendNotification,
} from './notification.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { UserRole } from '@edwix/shared';
import {
  templateQuerySchema,
  createTemplateSchema,
  updateTemplateSchema,
  alertQuerySchema,
  createAlertSchema,
  markAlertsReadSchema,
  logQuerySchema,
  sendNotificationSchema,
} from './notification.schema';

const router = Router();

router.use(authenticate);

// ── Templates ───────────────────────────────────
router.get('/templates', validate(templateQuerySchema, 'query'), listTemplates);
router.get('/templates/:id', getTemplateById);
router.post(
  '/templates',
  requireRole(UserRole.ADMIN),
  validate(createTemplateSchema, 'body'),
  createTemplate,
);
router.put(
  '/templates/:id',
  requireRole(UserRole.ADMIN),
  validate(updateTemplateSchema, 'body'),
  updateTemplate,
);
router.delete('/templates/:id', requireRole(UserRole.ADMIN), deleteTemplate);

// ── Alerts (static routes before parameterized) ─
router.get('/alerts/unread-count', getUnreadAlertCount);
router.get('/alerts', validate(alertQuerySchema, 'query'), listAlerts);
router.post(
  '/alerts',
  requireRole(UserRole.ADMIN),
  validate(createAlertSchema, 'body'),
  createAlert,
);
router.put(
  '/alerts/mark-read',
  validate(markAlertsReadSchema, 'body'),
  markAlertsRead,
);

// ── Logs ────────────────────────────────────────
router.get('/logs', requireRole(UserRole.ADMIN), validate(logQuerySchema, 'query'), listLogs);

// ── Send (stubbed) ──────────────────────────────
router.post(
  '/send',
  requireRole(UserRole.ADMIN, UserRole.RECEPTIONIST),
  validate(sendNotificationSchema, 'body'),
  sendNotification,
);

export default router;
