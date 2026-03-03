import { Router } from 'express';
import {
    getSuppliers,
    getSupplierById,
    createSupplier,
    updateSupplier,
    deleteSupplier,
} from './supplier.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { UserRole } from '@edwix/shared';
import {
    createSupplierSchema,
    updateSupplierSchema,
    supplierQuerySchema,
} from './supplier.schema';

const router = Router();

router.use(authenticate);

router.get('/', validate(supplierQuerySchema, 'query'), getSuppliers);
router.get('/:id', getSupplierById);

router.post(
    '/',
    requireRole(UserRole.ADMIN, UserRole.RECEPTIONIST),
    validate(createSupplierSchema, 'body'),
    createSupplier
);

router.put(
    '/:id',
    requireRole(UserRole.ADMIN, UserRole.RECEPTIONIST),
    validate(updateSupplierSchema, 'body'),
    updateSupplier
);

router.delete('/:id', requireRole(UserRole.ADMIN), deleteSupplier);

export default router;
