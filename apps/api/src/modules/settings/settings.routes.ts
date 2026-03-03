import { Router } from 'express';
import {
  getBusinessProfile,
  updateBusinessProfile,
  getLaborRates,
  getLaborRateById,
  createLaborRate,
  updateLaborRate,
  deleteLaborRate,
  getSettings,
  upsertSetting,
  deleteSetting,
} from './settings.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { UserRole } from '@edwix/shared';
import {
  updateBusinessProfileSchema,
  createLaborRateSchema,
  updateLaborRateSchema,
  upsertSettingSchema,
  settingQuerySchema,
} from './settings.schema';

const router = Router();

router.use(authenticate);

// Business Profile
router.get('/business-profile', getBusinessProfile);
router.put(
  '/business-profile',
  requireRole(UserRole.ADMIN),
  validate(updateBusinessProfileSchema, 'body'),
  updateBusinessProfile,
);

// Labor Rates
router.get('/labor-rates', getLaborRates);
router.get('/labor-rates/:id', getLaborRateById);
router.post(
  '/labor-rates',
  requireRole(UserRole.ADMIN),
  validate(createLaborRateSchema, 'body'),
  createLaborRate,
);
router.put(
  '/labor-rates/:id',
  requireRole(UserRole.ADMIN),
  validate(updateLaborRateSchema, 'body'),
  updateLaborRate,
);
router.delete('/labor-rates/:id', requireRole(UserRole.ADMIN), deleteLaborRate);

// General Settings
router.get('/general', requireRole(UserRole.ADMIN), validate(settingQuerySchema, 'query'), getSettings);
router.put(
  '/general',
  requireRole(UserRole.ADMIN),
  validate(upsertSettingSchema, 'body'),
  upsertSetting,
);
router.delete('/general/:key', requireRole(UserRole.ADMIN), deleteSetting);

export default router;
