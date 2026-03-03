import { Router } from 'express';
import {
    getDevices,
    getDeviceById,
    createDevice,
    updateDevice,
    deleteDevice,
    getDeviceCategories,
} from './device.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { UserRole } from '@edwix/shared';
import {
    createDeviceSchema,
    updateDeviceSchema,
    deviceQuerySchema,
} from './device.schema';

const router = Router();

// All device routes require authentication
router.use(authenticate);

// Note: the order is important. /categories must be above /:id
router.get('/categories', getDeviceCategories);
router.get('/', validate(deviceQuerySchema, 'query'), getDevices);
router.get('/:id', getDeviceById);

router.post(
    '/',
    requireRole(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.TECHNICIAN),
    validate(createDeviceSchema, 'body'),
    createDevice
);

router.put(
    '/:id',
    requireRole(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.TECHNICIAN),
    validate(updateDeviceSchema, 'body'),
    updateDevice
);

router.delete('/:id', requireRole(UserRole.ADMIN), deleteDevice);

export default router;
