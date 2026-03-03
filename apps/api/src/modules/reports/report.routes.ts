import { Router } from 'express';
import {
  getReportSummary,
  getRevenueReport,
  getTicketStats,
  getTechnicianPerformance,
  getInventoryAnalysis,
  getTopCustomers,
  getPartsUsage,
} from './report.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { UserRole } from '@edwix/shared';
import {
  revenueQuerySchema,
  ticketStatsQuerySchema,
  technicianQuerySchema,
  inventoryQuerySchema,
  topCustomersQuerySchema,
  partsUsageQuerySchema,
} from './report.schema';

const router = Router();

router.use(authenticate);

router.get('/summary', getReportSummary);

router.get(
  '/revenue',
  requireRole(UserRole.ADMIN),
  validate(revenueQuerySchema, 'query'),
  getRevenueReport,
);

router.get(
  '/tickets',
  requireRole(UserRole.ADMIN, UserRole.RECEPTIONIST),
  validate(ticketStatsQuerySchema, 'query'),
  getTicketStats,
);

router.get(
  '/technicians',
  requireRole(UserRole.ADMIN),
  validate(technicianQuerySchema, 'query'),
  getTechnicianPerformance,
);

router.get(
  '/inventory',
  validate(inventoryQuerySchema, 'query'),
  getInventoryAnalysis,
);

router.get(
  '/top-customers',
  requireRole(UserRole.ADMIN, UserRole.RECEPTIONIST),
  validate(topCustomersQuerySchema, 'query'),
  getTopCustomers,
);

router.get(
  '/parts-usage',
  requireRole(UserRole.ADMIN, UserRole.TECHNICIAN),
  validate(partsUsageQuerySchema, 'query'),
  getPartsUsage,
);

export default router;
