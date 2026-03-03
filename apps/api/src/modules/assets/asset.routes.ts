import { Router } from 'express';
import {
  listAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  checkoutAsset,
  checkinAsset,
  addMaintenance,
  getCheckouts,
  getMaintenanceLog,
} from './asset.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { UserRole } from '@edwix/shared';
import {
  assetQuerySchema,
  createAssetSchema,
  updateAssetSchema,
  checkoutSchema,
  checkinSchema,
  maintenanceSchema,
  subResourceQuerySchema,
} from './asset.schema';

const router = Router();

router.use(authenticate);

router.get('/', validate(assetQuerySchema, 'query'), listAssets);
router.get('/:id', getAssetById);
router.post(
  '/',
  requireRole(UserRole.ADMIN),
  validate(createAssetSchema, 'body'),
  createAsset,
);
router.put(
  '/:id',
  requireRole(UserRole.ADMIN),
  validate(updateAssetSchema, 'body'),
  updateAsset,
);
router.delete('/:id', requireRole(UserRole.ADMIN), deleteAsset);

// Checkout / Checkin
router.post(
  '/:id/checkout',
  requireRole(UserRole.ADMIN, UserRole.TECHNICIAN),
  validate(checkoutSchema, 'body'),
  checkoutAsset,
);
router.post(
  '/:id/checkin',
  requireRole(UserRole.ADMIN, UserRole.TECHNICIAN),
  validate(checkinSchema, 'body'),
  checkinAsset,
);
router.get(
  '/:id/checkouts',
  validate(subResourceQuerySchema, 'query'),
  getCheckouts,
);

// Maintenance
router.post(
  '/:id/maintenance',
  requireRole(UserRole.ADMIN, UserRole.TECHNICIAN),
  validate(maintenanceSchema, 'body'),
  addMaintenance,
);
router.get(
  '/:id/maintenance',
  validate(subResourceQuerySchema, 'query'),
  getMaintenanceLog,
);

export default router;
