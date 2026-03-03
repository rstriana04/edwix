import { Router } from 'express';
import {
    getCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
} from './customer.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { UserRole } from '@edwix/shared';
import {
    createCustomerSchema,
    updateCustomerSchema,
    customerQuerySchema,
} from './customer.schema';

const router = Router();

// All customer routes require authentication
router.use(authenticate);

router.get('/', validate(customerQuerySchema, 'query'), getCustomers);
router.get('/:id', getCustomerById);

router.post(
    '/',
    requireRole(UserRole.ADMIN, UserRole.RECEPTIONIST),
    validate(createCustomerSchema, 'body'),
    createCustomer
);

router.put(
    '/:id',
    requireRole(UserRole.ADMIN, UserRole.RECEPTIONIST),
    validate(updateCustomerSchema, 'body'),
    updateCustomer
);

router.delete('/:id', requireRole(UserRole.ADMIN), deleteCustomer);

export default router;
