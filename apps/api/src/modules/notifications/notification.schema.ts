import { z } from 'zod';
import { NotificationChannel, AlertType } from '@edwix/shared';

// ── Template schemas ────────────────────────────

export const templateQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  channel: z.nativeEnum(NotificationChannel).optional(),
  event: z.string().optional(),
});

export const createTemplateSchema = z.object({
  event: z.string().min(1, 'Event is required'),
  channel: z.nativeEnum(NotificationChannel),
  subject: z.string().optional().nullable(),
  body: z.string().min(1, 'Body template is required'),
  isActive: z.boolean().optional().default(true),
});

export const updateTemplateSchema = createTemplateSchema.partial();

// ── Alert schemas ───────────────────────────────

export const alertQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  isRead: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
  type: z.nativeEnum(AlertType).optional(),
});

export const createAlertSchema = z.object({
  type: z.nativeEnum(AlertType),
  referenceType: z.string().min(1, 'Reference type is required'),
  referenceId: z.string().min(1, 'Reference ID is required'),
  message: z.string().min(1, 'Message is required'),
  userId: z.string().optional().nullable(),
});

export const markAlertsReadSchema = z.object({
  alertIds: z.array(z.string().min(1)).min(1, 'At least one alert ID is required'),
});

// ── Log schemas ─────────────────────────────────

export const logQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  channel: z.nativeEnum(NotificationChannel).optional(),
  status: z.enum(['PENDING', 'SENT', 'FAILED']).optional(),
});

// ── Send schema ─────────────────────────────────

export const sendNotificationSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required'),
  ticketId: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  variables: z.record(z.string()).optional().default({}),
});
